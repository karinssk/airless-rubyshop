const mongoose = require("mongoose");

/**
 * RoomCategory Model
 * Categories for room types (e.g., Standard, Deluxe, Suite)
 */
const roomCategorySchema = new mongoose.Schema(
    {
        name: { type: mongoose.Schema.Types.Mixed, required: true }, // Multi-lang: {th: "", en: ""}
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: mongoose.Schema.Types.Mixed, default: "" }, // Multi-lang
        order: { type: Number, default: 0 }, // For sorting
        icon: { type: String, default: "" }, // Icon/image for category
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("RoomCategory", roomCategorySchema);
