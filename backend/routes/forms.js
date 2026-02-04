const express = require("express");
const router = express.Router();
const QuotationRequest = require("../models/QuotationRequest");

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
    res.status(201).json({ submission: { ...submission.toObject(), id: submission._id } });
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

module.exports = router;
