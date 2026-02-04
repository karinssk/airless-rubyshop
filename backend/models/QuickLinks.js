const mongoose = require("mongoose");

const quickLinksSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        whatsapp: {
            enabled: { type: Boolean, default: true },
            href: { type: String, default: "" },
        },
        line: {
            enabled: { type: Boolean, default: true },
            href: { type: String, default: "" },
        },
        phone: {
            enabled: { type: Boolean, default: true },
            href: { type: String, default: "" },
            label: { type: String, default: "" },
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("QuickLinks", quickLinksSchema);
