const { randomUUID } = require("crypto");
const { nowDate, retentionDate } = require("./utils/helpers");
const ChatSession = require("./models/ChatSession");

const toPublicSession = (session) => ({
    id: session.sessionId,
    visitorId: session.visitorId,
    customerEmail: session.customerEmail,
    customerPhone: session.customerPhone,
    authProvider: session.authProvider,
    status: session.status,
    assignedAdminId: session.assignedAdminId,
    createdAt: session.createdAt ? session.createdAt.toISOString() : null,
    lastMessageAt: session.lastMessageAt ? session.lastMessageAt.toISOString() : null,
    messageCount: session.messages?.length || 0,
});

const emitSessionUpdate = (io, session) => {
    const payload = toPublicSession(session);
    io.to("admins").emit("sessionUpdated", payload);
};

const buildAdminProfile = (adminId, presence) => ({
    id: adminId,
    name: presence?.profile?.name || `Admin ${String(adminId).slice(0, 4)}`,
    avatar: presence?.profile?.avatar || "",
    color: presence?.profile?.color || "#2563eb",
});

const emitAdminPresence = (io, adminPresence) => {
    const admins = Array.from(adminPresence.entries())
        .filter(([, presence]) => presence?.sockets?.size)
        .map(([adminId, presence]) => buildAdminProfile(adminId, presence));
    io.to("admins").emit("adminPresence", { admins });
};

const emitSessionAdmins = (io, adminPresence, sessionId) => {
    const admins = Array.from(adminPresence.entries())
        .filter(([, presence]) => presence?.sessions?.has(sessionId))
        .map(([adminId, presence]) => buildAdminProfile(adminId, presence));
    io.to(`session:${sessionId}`).emit("sessionAdmins", { sessionId, admins });
};

const initSocket = (io, adminPresence) => {
    io.on("connection", (socket) => {
        const auth = socket.handshake.auth || {};
        const role = auth.role || "visitor";
        const adminId = auth.adminId || null;
        const adminName = auth.adminName || "";
        const adminAvatar = auth.adminAvatar || "";
        const adminColor = auth.adminColor || "";
        const initialSessionId = auth.sessionId || null;

        if (role === "admin" && adminId) {
            socket.join("admins");
            if (!adminPresence.has(adminId)) {
                adminPresence.set(adminId, {
                    sessions: new Set(),
                    sockets: new Set(),
                    profile: {
                        id: adminId,
                        name: adminName,
                        avatar: adminAvatar,
                        color: adminColor || "#2563eb",
                    },
                });
            } else if (adminName || adminAvatar || adminColor) {
                const presence = adminPresence.get(adminId);
                if (presence) {
                    presence.profile = {
                        id: adminId,
                        name: adminName || presence.profile?.name,
                        avatar: adminAvatar || presence.profile?.avatar,
                        color: adminColor || presence.profile?.color || "#2563eb",
                    };
                }
            }
            adminPresence.get(adminId)?.sockets.add(socket.id);
            emitAdminPresence(io, adminPresence);
        }

        if (role === "visitor" && initialSessionId) {
            socket.join(`session:${initialSessionId}`);
            emitSessionAdmins(io, adminPresence, initialSessionId);
        }

        socket.on("joinSession", ({ sessionId } = {}) => {
            if (!sessionId) return;
            socket.join(`session:${sessionId}`);
            if (role === "admin" && adminId) {
                adminPresence.get(adminId)?.sessions.add(sessionId);
            }
            emitSessionAdmins(io, adminPresence, sessionId);
        });

        socket.on("leaveSession", ({ sessionId } = {}) => {
            if (!sessionId) return;
            socket.leave(`session:${sessionId}`);
            if (role === "admin" && adminId) {
                adminPresence.get(adminId)?.sessions.delete(sessionId);
            }
            emitSessionAdmins(io, adminPresence, sessionId);
        });

        socket.on("typing", ({ sessionId, isTyping } = {}) => {
            if (!sessionId) return;
            if (role === "admin" && adminId) {
                const presence = adminPresence.get(adminId);
                const profile = buildAdminProfile(adminId, presence);
                io.to(`session:${sessionId}`).emit("typing", {
                    sessionId,
                    role: "admin",
                    adminId,
                    name: profile.name,
                    avatar: profile.avatar,
                    color: profile.color,
                    isTyping: Boolean(isTyping),
                });
                return;
            }
            if (role === "visitor") {
                io.to(`session:${sessionId}`).emit("typing", {
                    sessionId,
                    role: "visitor",
                    isTyping: Boolean(isTyping),
                });
            }
        });

        socket.on("message", async ({ id, sessionId, sender, text, attachments } = {}) => {
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
            if (!sessionId || (!trimmedText && safeAttachments.length === 0)) return;

            const messageId = typeof id === "string" && id.trim() ? id : randomUUID();
            const message = {
                id: messageId,
                sessionId,
                sender: role === "admin" ? "admin" : "visitor",
                text: trimmedText,
                attachments: safeAttachments,
                createdAt: nowDate(),
            };

            const existingSession = await ChatSession.findOne({ sessionId });
            if (!existingSession) return;

            if (role === "admin" && adminId) {
                if (
                    existingSession.assignedAdminId &&
                    existingSession.assignedAdminId !== adminId
                ) {
                    existingSession.assignedAdminId = adminId;
                    existingSession.status = "assigned";
                }
            }

            const update = {
                $push: { messages: message },
                $set: {
                    lastMessageAt: message.createdAt,
                    expiresAt: retentionDate(message.createdAt),
                },
            };

            if (role === "admin" && adminId) {
                update.$set.assignedAdminId = adminId;
                update.$set.status = "assigned";
            }

            const session = await ChatSession.findOneAndUpdate(
                { sessionId },
                update,
                { new: true }
            );

            if (!session) return;

            io.to(`session:${sessionId}`).emit("message", message);
            emitSessionUpdate(io, session);
        });

        socket.on("disconnect", () => {
            if (role === "admin" && adminId) {
                const presence = adminPresence.get(adminId);
                if (!presence) return;
                presence.sockets.delete(socket.id);
                if (presence.sockets.size === 0) {
                    const sessionIds = Array.from(presence.sessions || []);
                    adminPresence.delete(adminId);
                    emitAdminPresence(io, adminPresence);
                    sessionIds.forEach((sessionId) =>
                        emitSessionAdmins(io, adminPresence, sessionId)
                    );
                } else {
                    emitAdminPresence(io, adminPresence);
                }
            }
        });
    });
};

module.exports = initSocket;
