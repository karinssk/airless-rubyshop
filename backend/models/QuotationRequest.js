const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        company: { type: String, default: "" },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        service: { type: String, required: true },
        details: { type: String, default: "" },
        status: { type: String, default: "new", index: true },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("QuotationRequest", quotationSchema);
