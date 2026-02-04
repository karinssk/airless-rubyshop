const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, default: null }, // Null if auth via social only
        name: { type: String, default: "" },
        phoneNumber: { type: String, default: "" },
        profileImage: { type: String, default: "" },
        provider: { type: String, default: "local" }, // local, google, line
        providerId: { type: String, default: null }, // social id
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Customer", customerSchema);
