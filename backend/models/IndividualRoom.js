const mongoose = require("mongoose");

/**
 * IndividualRoom Model
 * Represents a physical room unit (e.g., Room 101, 102, etc.)
 * Links to a Room type (e.g., Deluxe Twin)
 */
const individualRoomSchema = new mongoose.Schema(
    {
        roomTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true,
        },
        roomNumber: { type: String, required: true, unique: true, index: true }, // "101", "102", etc.
        floor: { type: Number, default: 1 },
        building: { type: String, default: "" }, // "Main Building", "Annex", etc.
        status: {
            type: String,
            default: "available",
            enum: ["available", "occupied", "maintenance", "cleaning"],
            index: true,
        },
        notes: { type: String, default: "" }, // Internal notes for staff
        isActive: { type: Boolean, default: true, index: true }, // Can be deactivated without deleting
    },
    { timestamps: true, versionKey: false }
);

// Compound index for efficient queries
individualRoomSchema.index({ roomTypeId: 1, status: 1 });

module.exports = mongoose.model("IndividualRoom", individualRoomSchema);
