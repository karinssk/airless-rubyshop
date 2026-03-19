const express = require("express");
const router = express.Router();
const QuotationRequest = require("../models/QuotationRequest");

const resolveLineConfig = () => ({
    channelAccessToken:
        process.env.CHANNEL_ACCESS_TOKEN ||
        process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret:
        process.env.CHANNEL_SECRET ||
        process.env.LINE_CHANNEL_SECRET,
    reportUserId: process.env.REPORT_LINE_USER_ID,
});

const formatSubmissionLineMessage = (submission) => {
    const createdAt = new Date(submission.createdAt || Date.now()).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
    });
    return [
        "มีฟอร์มขอใบเสนอราคาใหม่",
        `ชื่อ: ${submission.name || "-"}`,
        `บริษัท: ${submission.company || "-"}`,
        `อีเมล: ${submission.email || "-"}`,
        `เบอร์โทร: ${submission.phone || "-"}`,
        `บริการ: ${submission.service || "-"}`,
        `รายละเอียด: ${submission.details || "-"}`,
        `เวลา: ${createdAt}`,
        `ID: ${submission._id || submission.id || "-"}`,
    ].join("\n");
};

const formatQuickFromLineMessage = (submission, sourceUrl = "") => {
    const createdAt = new Date(submission.createdAt || Date.now()).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
    });
    return [
        "มีฟอร์ม Quick From ใหม่",
        `เบอร์โทร: ${submission.phone || "-"}`,
        `ลิงก์: ${sourceUrl || "-"}`,
        `เวลา: ${createdAt}`,
        `ID: ${submission._id || submission.id || "-"}`,
    ].join("\n");
};

const pushLineMessage = async (messageText) => {
    const { channelAccessToken, channelSecret, reportUserId } = resolveLineConfig();
    if (!channelAccessToken || !reportUserId) {
        throw new Error("LINE config missing (channel access token or report user id)");
    }
    if (!channelSecret) {
        throw new Error("LINE config missing (channel secret)");
    }

    const text = String(messageText || "").slice(0, 5000);
    if (!text) {
        throw new Error("Cannot send empty LINE message");
    }

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
            to: reportUserId,
            messages: [{ type: "text", text }],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LINE push failed (${response.status}): ${errorText}`);
    }
};

router.post("/quotation", async (req, res) => {
    const payload = req.body || {};
    const requiredFields = ["name", "email", "phone", "service"];
    const missing = requiredFields.filter((field) => !payload[field]);
    if (missing.length > 0) {
        return res.status(400).json({ error: "Missing required fields", missing });
    }
    const submission = await QuotationRequest.create({
        name: payload.name,
        company: payload.company || "",
        email: payload.email,
        phone: payload.phone,
        service: payload.service,
        details: payload.details || "",
    });

    let lineNotificationSent = false;
    let lineNotificationError = null;
    try {
        await pushLineMessage(formatSubmissionLineMessage(submission));
        lineNotificationSent = true;
    } catch (error) {
        lineNotificationError = error?.message || "Failed to send LINE notification";
        console.error("[forms] LINE notification failed", error);
    }

    res.status(201).json({
        submission: { ...submission.toObject(), id: submission._id },
        lineNotificationSent,
        ...(lineNotificationError ? { lineNotificationError } : {}),
    });
});

router.post("/quick-from", async (req, res) => {
    const phone = String(req.body?.phone || "").trim();
    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: "Phone must be exactly 10 digits", field: "phone" });
    }
    const pageUrl = String(req.body?.pageUrl || "").trim();

    const submission = await QuotationRequest.create({
        name: "Quick From",
        company: "",
        email: `quick-from-${Date.now()}@local.invalid`,
        phone,
        service: "quick-from",
        details: pageUrl ? `Source URL: ${pageUrl}` : "",
    });

    let lineNotificationSent = false;
    let lineNotificationError = null;
    try {
        await pushLineMessage(formatQuickFromLineMessage(submission, pageUrl));
        lineNotificationSent = true;
    } catch (error) {
        lineNotificationError = error?.message || "Failed to send LINE notification";
        console.error("[forms] quick-from LINE notification failed", error);
    }

    res.status(201).json({
        submission: { ...submission.toObject(), id: submission._id },
        lineNotificationSent,
        ...(lineNotificationError ? { lineNotificationError } : {}),
    });
});

router.get("/quotation", async (_req, res) => {
    const submissions = await QuotationRequest.find({})
        .sort({ createdAt: -1 })
        .lean();
    res.json({
        submissions: submissions.map((item) => ({
            id: item._id,
            name: item.name,
            company: item.company,
            email: item.email,
            phone: item.phone,
            service: item.service,
            details: item.details,
            status: item.status,
            createdAt: item.createdAt,
        })),
    });
});

router.patch("/quotation/:id", async (req, res) => {
    const status = req.body?.status;
    const submission = await QuotationRequest.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true }
    ).lean();
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    res.json({ submission: { ...submission, id: submission._id } });
});

router.delete("/quotation/:id", async (req, res) => {
    const submission = await QuotationRequest.findByIdAndDelete(req.params.id).lean();
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    res.json({ ok: true });
});

router.post("/quotation/:id/notify-line", async (req, res) => {
    const submission = await QuotationRequest.findById(req.params.id).lean();
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    await pushLineMessage(formatSubmissionLineMessage(submission));
    res.json({ ok: true, sent: true });
});

router.post("/line/send", async (req, res) => {
    const message = String(req.body?.message || "").trim();
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }
    await pushLineMessage(message);
    res.json({ ok: true, sent: true });
});

router.post("/line/test", async (_req, res) => {
    const { reportUserId } = resolveLineConfig();
    const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    await pushLineMessage(`✅ LINE test from RUBYSHOP admin\nเวลา: ${now}\nTarget: ${reportUserId}`);
    res.json({ ok: true, sent: true, target: reportUserId });
});

module.exports = router;
