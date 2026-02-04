const mongoose = require("mongoose");

const paymentSettingSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ["omise", "stripe", "manual"],
            default: "omise",
            index: true,
        },
        // Bank transfer details (used when provider is "manual")
        bankAccounts: [
            {
                bankName: { type: String },
                accountName: { type: String },
                accountNumber: { type: String },
            },
        ],
        // PromptPay QR code image path
        promptPayQrImage: {
            type: String,
            default: "",
        },
        // Whether pay on site is enabled (used when provider is "manual")
        payOnSiteEnabled: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PaymentSetting", paymentSettingSchema);
