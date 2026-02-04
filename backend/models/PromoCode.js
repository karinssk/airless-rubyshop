const mongoose = require("mongoose");

/**
 * PromoCode Model
 * Represents promotional discount codes for bookings
 */
const promoCodeSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, index: true },

        // Discount Configuration
        discountType: {
            type: String,
            required: true,
            enum: ["percentage", "fixed"],
        },
        discountValue: { type: Number, required: true }, // Percentage (e.g., 10 for 10%) or fixed amount

        // Description
        name: { type: mongoose.Schema.Types.Mixed, default: "" }, // Multi-lang: {th: "", en: ""}
        description: { type: mongoose.Schema.Types.Mixed, default: "" }, // Multi-lang

        // Validity
        validFrom: { type: Date, default: Date.now },
        validTo: { type: Date, default: null }, // null = no expiry

        // Usage Limits
        maxUses: { type: Number, default: null }, // null = unlimited
        usedCount: { type: Number, default: 0 },
        maxUsesPerUser: { type: Number, default: 1 }, // Per email address

        // Booking Restrictions
        minNights: { type: Number, default: 1 }, // Minimum nights required
        minAmount: { type: Number, default: 0 }, // Minimum booking amount required
        applicableRoomTypes: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Room",
            default: [], // Empty = all rooms
        },

        // Auto-apply
        isDefault: { type: Boolean, default: false, index: true }, // Auto-applied on booking form

        // Status
        status: {
            type: String,
            default: "active",
            enum: ["active", "inactive"],
            index: true,
        },

        // Internal
        internalNotes: { type: String, default: "" },
    },
    { timestamps: true, versionKey: false }
);

// Method to check if promo code is valid
promoCodeSchema.methods.isValid = function () {
    if (this.status !== "active") return false;

    const now = new Date();
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validTo && now > this.validTo) return false;

    if (this.maxUses !== null && this.usedCount >= this.maxUses) return false;

    return true;
};

// Method to calculate discount
promoCodeSchema.methods.calculateDiscount = function (amount) {
    if (this.discountType === "percentage") {
        return (amount * this.discountValue) / 100;
    } else {
        return Math.min(this.discountValue, amount); // Can't discount more than the amount
    }
};

module.exports = mongoose.model("PromoCode", promoCodeSchema);
