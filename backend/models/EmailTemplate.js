const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
    {
        type: { type: String, required: true, unique: true, index: true },
        subject: { type: String, required: true },
        html: { type: String, required: true },
        staticInfo: {
            hotelName: { type: String, default: "" },
            hotelAddress: { type: String, default: "" },
            hotelPhone: { type: String, default: "" },
            hotelEmail: { type: String, default: "" },
            checkInInfo: { type: String, default: "" },
            checkOutInfo: { type: String, default: "" },
        },
        editorData: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
