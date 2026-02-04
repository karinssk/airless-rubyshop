const express = require("express");
const router = express.Router();
const { randomBytes } = require("crypto");
const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");
const { requireAdmin, requireOwner } = require("../utils/auth");

const allowedRoles = new Set(["admin", "owner"]);
const allowedStatuses = new Set(["approved", "pending", "disabled"]);
const generateTempPassword = () => randomBytes(6).toString("hex");

router.get("/users", requireAdmin, requireOwner, async (_req, res) => {
    const users = await AdminUser.find({})
        .sort({ createdAt: -1 })
        .lean();
    res.json({
        users: users.map((user) => ({
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            color: user.color,
            role: user.role,
            status: user.status,
            provider: user.provider,
            createdAt: user.createdAt,
        })),
    });
});

router.patch("/users/:id", requireAdmin, requireOwner, async (req, res) => {
    const updates = {};
    if (req.body?.role) {
        if (!allowedRoles.has(req.body.role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        updates.role = req.body.role;
    }
    if (req.body?.status) {
        if (!allowedStatuses.has(req.body.status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        updates.status = req.body.status;
    }
    if (typeof req.body?.name === "string") {
        updates.name = req.body.name.trim();
    }

    if (
        String(req.adminUser._id) === String(req.params.id) &&
        ((updates.role && updates.role !== "owner") ||
            (updates.status && updates.status !== "approved"))
    ) {
        return res.status(400).json({ error: "Cannot update your own access" });
    }

    const user = await AdminUser.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            color: user.color,
            role: user.role,
            status: user.status,
            provider: user.provider,
            createdAt: user.createdAt,
        },
    });
});

router.post("/users/:id/approve", requireAdmin, requireOwner, async (req, res) => {
    const user = await AdminUser.findByIdAndUpdate(
        req.params.id,
        { $set: { status: "approved" } },
        { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { id: user._id, status: user.status } });
});

router.post("/users/:id/reject", requireAdmin, requireOwner, async (req, res) => {
    await AdminUser.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});

router.post(
    "/users/:id/reset-password",
    requireAdmin,
    requireOwner,
    async (req, res) => {
        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const user = await AdminUser.findByIdAndUpdate(
            req.params.id,
            { $set: { passwordHash, provider: "password" } },
            { new: true }
        ).lean();
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({
            user: { id: user._id, email: user.email },
            tempPassword,
        });
    }
);

module.exports = router;
