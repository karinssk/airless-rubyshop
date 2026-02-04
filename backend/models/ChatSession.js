const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        sessionId: { type: String, required: true },
        sender: { type: String, required: true },
        text: { type: String, default: "" },
        attachments: {
            type: [
                {
                    id: { type: String, required: true },
                    url: { type: String, required: true },
                    filename: { type: String, required: true },
                    mime: { type: String, required: true },
                    size: { type: Number, required: true },
                },
            ],
            default: [],
        },
        createdAt: { type: Date, required: true },
    },
    { _id: false }
);

const sessionSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        visitorId: { type: String, required: true },
        customerEmail: { type: String, default: null },
        customerPhone: { type: String, default: null },
        authProvider: { type: String, default: null },
        status: { type: String, default: "open", index: true },
        assignedAdminId: { type: String, default: null, index: true },
        createdAt: { type: Date, required: true },
        lastMessageAt: { type: Date, default: null, index: true },
        expiresAt: { type: Date, index: { expires: 0 } },
        messages: { type: [messageSchema], default: [] },
    },
    { versionKey: false }
);

module.exports = mongoose.model("ChatSession", sessionSchema);
