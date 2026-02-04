const mongoose = require("mongoose");

/**
 * Booking Model
 * Represents a room reservation/booking
 */
const bookingSchema = new mongoose.Schema(
    {
        // Booking Reference
        bookingNumber: { type: String, required: true, unique: true, index: true },

        // Room Information
        roomTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true,
        },
        individualRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "IndividualRoom",
            default: null, // Assigned at check-in or earlier
        },

        // Dates
        checkInDate: { type: Date, required: true, index: true },
        checkOutDate: { type: Date, required: true, index: true },
        nights: { type: Number, required: true }, // Calculated

        // Guest Information
        guestName: { type: String, required: true },
        guestEmail: { type: String, required: true },
        guestPhone: { type: String, required: true },
        numberOfGuests: { type: Number, default: 1 },

        // Pricing
        roomPrice: { type: Number, required: true }, // Original room price
        promoCode: { type: String, default: "" },
        promoCodeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PromoCode",
            default: null,
        },
        discount: { type: Number, default: 0 }, // Discount amount
        totalPrice: { type: Number, required: true }, // Final price after discount

        // Status
        status: {
            type: String,
            default: "confirmed",
            enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled", "no-show"],
            index: true,
        },

        // Payment (for future use)
        paymentStatus: {
            type: String,
            default: "unpaid",
            enum: ["unpaid", "partial", "paid", "refunded"],
        },
        paymentMethod: { type: String, default: "" },
        paymentProvider: { type: String, default: "" },
        paymentReference: { type: String, default: "" },
        paymentSlip: { type: String, default: "" }, // Payment slip/receipt image path

        // Additional Information
        specialRequests: { type: String, default: "" },
        internalNotes: { type: String, default: "" }, // Admin notes

        // Calendar Integration
        calendarEventId: { type: String, default: "" }, // Google Calendar event ID

        // Cancellation
        cancelledAt: { type: Date, default: null },
        cancellationReason: { type: String, default: "" },
    },
    { timestamps: true, versionKey: false }
);

// Compound indexes for efficient queries
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ roomTypeId: 1, status: 1 });
bookingSchema.index({ guestEmail: 1, createdAt: -1 });

// Generate booking number before validation so required check passes
bookingSchema.pre("validate", async function (next) {
    if (!this.bookingNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        // Find the last booking number for today
        const lastBooking = await mongoose
            .model("Booking")
            .findOne({
                bookingNumber: new RegExp(`^BK${year}${month}${day}`),
            })
            .sort({ bookingNumber: -1 })
            .lean();

        let sequence = 1;
        if (lastBooking) {
            const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        this.bookingNumber = `BK${year}${month}${day}${String(sequence).padStart(4, "0")}`;
    }
    next();
});

module.exports = mongoose.model("Booking", bookingSchema);
