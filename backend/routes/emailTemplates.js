const express = require("express");
const router = express.Router();
const EmailTemplate = require("../models/EmailTemplate");
const { requireAdmin } = require("../utils/auth");
const { getDefaultEmailTemplate } = require("../utils/emailTemplates");

const allowedTypes = new Set([
    "booking_confirmation",
    "booking_cancellation",
    "booking_payment_pending",
]);

const ensureTemplate = async (type) => {
    const defaultTemplate = getDefaultEmailTemplate(type);
    if (!defaultTemplate) return null;
    let template = await EmailTemplate.findOne({ type }).lean();
    if (!template) {
        template = await EmailTemplate.create({
            type,
            subject: defaultTemplate.subject,
            html: defaultTemplate.html,
            staticInfo: defaultTemplate.staticInfo,
            editorData: defaultTemplate.editorData || null,
        });
    }
    return template;
};

router.get("/email-templates/:type", requireAdmin, async (req, res) => {
    const type = req.params.type;
    if (!allowedTypes.has(type)) {
        return res.status(400).json({ error: "Invalid template type" });
    }
    try {
        const template = await ensureTemplate(type);
        res.json({ template });
    } catch (error) {
        res.status(500).json({ error: "Failed to load email template" });
    }
});

router.put("/email-templates/:type", requireAdmin, async (req, res) => {
    const type = req.params.type;
    if (!allowedTypes.has(type)) {
        return res.status(400).json({ error: "Invalid template type" });
    }
    const payload = {
        subject: String(req.body?.subject || "").trim(),
        html: String(req.body?.html || ""),
        staticInfo: {
            hotelName: String(req.body?.staticInfo?.hotelName || ""),
            hotelAddress: String(req.body?.staticInfo?.hotelAddress || ""),
            hotelPhone: String(req.body?.staticInfo?.hotelPhone || ""),
            hotelEmail: String(req.body?.staticInfo?.hotelEmail || ""),
            checkInInfo: String(req.body?.staticInfo?.checkInInfo || ""),
            checkOutInfo: String(req.body?.staticInfo?.checkOutInfo || ""),
        },
        editorData: req.body?.editorData || null,
    };
    if (!payload.subject || !payload.html) {
        return res.status(400).json({ error: "Subject and HTML are required" });
    }
    try {
        const template = await EmailTemplate.findOneAndUpdate(
            { type },
            { $set: payload },
            { new: true, upsert: true }
        ).lean();
        res.json({ template });
    } catch (error) {
        res.status(500).json({ error: "Failed to save email template" });
    }
});

module.exports = router;
