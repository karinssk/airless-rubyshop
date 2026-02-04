const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");
const ChatSession = require("../models/ChatSession");
const { nowDate, retentionDate, normalizeBaseUrl } = require("../utils/helpers");
const { createUpload, uploadsDir } = require("../utils/storage");

// Helpers for chat (duplicated from index or extracted? Need to ensure socket can use them too if needed)
// For now, I'm defining them here or using utils.
// access to io?
// The REST endpoints emit socket events.
// I need `io` instance.
// I'll create the router as a function that accepts `io` and `adminPresence`.

const toPublicSession = (session) => ({
    id: session.sessionId,
    visitorId: session.visitorId,
    customerEmail: session.customerEmail,
    customerPhone: session.customerPhone,
    authProvider: session.authProvider,
    status: session.status,
    assignedAdminId: session.assignedAdminId,
    createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : null,
    lastMessageAt: session.lastMessageAt ? new Date(session.lastMessageAt).toISOString() : null,
    messageCount: session.messages?.length || 0,
});

module.exports = (io, adminPresence) => {
    const uploadChatAttachment = createUpload({
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype) {
                cb(new Error("Unsupported file type"));
                return;
            }
            if (file.mimetype.startsWith("image/")) {
                cb(null, true);
                return;
            }
            const allowed = new Set([
                "application/pdf",
                "text/plain",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ]);
            if (allowed.has(file.mimetype)) {
                cb(null, true);
                return;
            }
            cb(new Error("Unsupported file type"));
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    });
    const emitSessionUpdate = (session) => {
        const payload = toPublicSession(session);
        io.to("admins").emit("sessionUpdated", payload);
    };

    router.post("/session", async (req, res) => {
        const visitorId = req.body?.visitorId || `visitor_${randomUUID()}`;
        const { customerEmail, customerPhone, authProvider } = req.body || {};
        const now = nowDate();

        const existingSession = await ChatSession.findOne({
            visitorId,
            expiresAt: { $gt: now },
        }).sort({ lastMessageAt: -1, createdAt: -1 });

        if (existingSession) {
            return res.json({ sessionId: existingSession.sessionId, visitorId });
        }

        const sessionId = randomUUID();
        const session = new ChatSession({
            sessionId,
            visitorId,
            customerEmail,
            customerPhone,
            authProvider,
            status: "open",
            assignedAdminId: null,
            createdAt: now,
            lastMessageAt: null,
            expiresAt: retentionDate(now),
            messages: [],
        });

        await session.save();
        emitSessionUpdate(session);

        res.status(201).json({ sessionId, visitorId });
    });

    router.patch("/sessions/:id/customer", async (req, res) => {
        const { customerEmail, customerPhone, authProvider } = req.body || {};
        const session = await ChatSession.findOneAndUpdate(
            { sessionId: req.params.id },
            { $set: { customerEmail, customerPhone, authProvider } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        emitSessionUpdate(session);
        res.json({ session: toPublicSession(session) });
    });

    router.get("/sessions", async (_req, res) => {
        const sessions = await ChatSession.find({}).lean();
        const sorted = sessions
            .map(toPublicSession)
            .sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));
        res.json({ sessions: sorted });
    });

    router.post("/sessions/:id/assign", async (req, res) => {
        const force = Boolean(req.body?.force);
        const adminId = req.body?.adminId || null;
        let finalAdminId = adminId;

        if (!finalAdminId) {
            const admins = Array.from(adminPresence.entries()).filter(
                ([, presence]) => presence?.sockets?.size
            );
            if (admins.length === 0) {
                return res.status(409).json({ error: "No admin available" });
            }
            admins.sort((a, b) => a[1].sessions.size - b[1].sessions.size);
            finalAdminId = admins[0][0];
        }

        const session = await ChatSession.findOne({ sessionId: req.params.id });
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.assignedAdminId && session.assignedAdminId !== finalAdminId) {
            if (!force) {
                return res.status(409).json({ error: "Session already assigned" });
            }
        }

        session.assignedAdminId = finalAdminId;
        session.status = "assigned";
        session.expiresAt = retentionDate(new Date());
        await session.save();

        emitSessionUpdate(session);
        res.json({ session: toPublicSession(session) });
    });

    router.post(
        "/sessions/:id/attachments",
        uploadChatAttachment.single("file"),
        async (req, res) => {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const session = await ChatSession.findOne({ sessionId: req.params.id });
            if (!session) {
                const filePath = path.join(uploadsDir, req.file.filename);
                fs.promises.unlink(filePath).catch(() => null);
                return res.status(404).json({ error: "Session not found" });
            }

            const baseUrl =
                normalizeBaseUrl(process.env.BACKEND_URL) ||
                `${req.protocol}://${req.get("host")}`;
            const attachment = {
                id: randomUUID(),
                url: `${baseUrl}/uploads/${req.file.filename}`,
                filename: req.file.originalname,
                mime: req.file.mimetype,
                size: req.file.size,
            };

            res.status(201).json({ attachment });
        }
    );

    router.get("/sessions/:id/messages", async (req, res) => {
        const session = await ChatSession.findOne({ sessionId: req.params.id }).lean();
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.json({ messages: session.messages || [] });
    });

    router.post("/sessions/:id/messages", async (req, res) => {
        const { text, attachments } = req.body || {};
        const trimmedText = typeof text === "string" ? text.trim() : "";
        const safeAttachments = Array.isArray(attachments)
            ? attachments
                .map((item) => ({
                    id: String(item?.id || ""),
                    url: String(item?.url || ""),
                    filename: String(item?.filename || ""),
                    mime: String(item?.mime || ""),
                    size: Number(item?.size || 0),
                }))
                .filter(
                    (item) =>
                        item.id &&
                        item.url &&
                        item.filename &&
                        item.mime &&
                        Number.isFinite(item.size)
                )
            : [];
        if (!trimmedText && safeAttachments.length === 0) {
            return res.status(400).json({ error: "Missing message content" });
        }

        const message = {
            id: randomUUID(),
            sessionId: req.params.id,
            sender: "visitor",
            text: trimmedText,
            attachments: safeAttachments,
            createdAt: nowDate(),
        };

        const session = await ChatSession.findOneAndUpdate(
            { sessionId: req.params.id },
            {
                $push: { messages: message },
                $set: {
                    lastMessageAt: message.createdAt,
                    expiresAt: retentionDate(message.createdAt),
                },
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        io.to(`session:${session.sessionId}`).emit("message", message);
        emitSessionUpdate(session);

        res.status(201).json({ message });
    });

    return router;
};
