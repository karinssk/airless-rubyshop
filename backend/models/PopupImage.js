const mongoose = require("mongoose");

const popupImageSchema = new mongoose.Schema(
    {
        enabled: {
            type: Boolean,
            default: false,
        },
        imageUrl: {
            type: String,
            default: "",
        },
        buttonText: {
            type: String,
            default: "Click to see promotion",
        },
        buttonLink: {
            type: String,
            default: "",
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("PopupImage", popupImageSchema);
