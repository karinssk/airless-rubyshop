const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, default: "" },
        name: { type: String, default: "" },
        avatar: { type: String, default: "" },
        color: { type: String, default: "#2563eb" },
        role: { type: String, default: "admin", index: true },
        status: { type: String, default: "pending", index: true },
        provider: { type: String, default: "password" },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("AdminUser", adminUserSchema);
