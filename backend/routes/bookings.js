const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const IndividualRoom = require("../models/IndividualRoom");
const PromoCode = require("../models/PromoCode");
const { createBookingEvent, updateBookingEvent, deleteBookingEvent } = require("../utils/calendarHelpers");
const { sendBookingConfirmation, sendBookingCancellation } = require("../utils/emailService");
const { requireAdmin } = require("../utils/auth");

// Helper function to extract language-specific string
function getLangString(value, locale) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.th || value.en || "";
}

// Helper function to calculate nights between dates
function calculateNights(checkIn, checkOut) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((checkOut - checkIn) / msPerDay);
}

// Helper function to check room availability
async function checkRoomAvailability(roomTypeId, checkInDate, checkOutDate, excludeBookingId = null) {
    try {
        const room = await Room.findById(roomTypeId).lean();
        if (!room) return 0;

        const query = {
            roomTypeId: roomTypeId,
            status: { $in: ["confirmed", "checked-in"] },
            checkInDate: { $lt: checkOutDate },
            checkOutDate: { $gt: checkInDate },
        };

        // Exclude a specific booking (for updates)
        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }

        const overlappingBookings = await Booking.countDocuments(query);
        return Math.max(0, room.totalRooms - overlappingBookings);
    } catch (error) {
        console.error("Error checking availability:", error);
        return 0;
    }
}

// Helper function to find available individual room
async function findAvailableIndividualRoom(roomTypeId, checkInDate, checkOutDate) {
    try {
        // Get all individual rooms of this type that are active
        const allIndividualRooms = await IndividualRoom.find({
            roomTypeId: roomTypeId,
            isActive: true,
        }).lean();

        if (allIndividualRooms.length === 0) return null;

        // Get all bookings that overlap with the requested dates
        const overlappingBookings = await Booking.find({
            roomTypeId: roomTypeId,
            status: { $in: ["confirmed", "checked-in"] },
            checkInDate: { $lt: checkOutDate },
            checkOutDate: { $gt: checkInDate },
            individualRoomId: { $ne: null },
        }).lean();

        // Get IDs of occupied individual rooms
        const occupiedRoomIds = new Set(
            overlappingBookings.map((b) => b.individualRoomId?.toString())
        );

        // Find first available individual room
        const availableRoom = allIndividualRooms.find(
            (ir) => !occupiedRoomIds.has(ir._id.toString())
        );

        return availableRoom || null;
    } catch (error) {
        console.error("Error finding available individual room:", error);
        return null;
    }
}

// ==================== PUBLIC ROUTES ====================

// Check availability for a room type
router.get("/availability", async (req, res) => {
    try {
        const { roomTypeId, checkIn, checkOut } = req.query;

        if (!roomTypeId || !checkIn || !checkOut) {
            return res.status(400).json({
                error: "Room type, check-in, and check-out dates are required",
            });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkInDate >= checkOutDate) {
            return res.status(400).json({
                error: "Check-out date must be after check-in date",
            });
        }

        const available = await checkRoomAvailability(roomTypeId, checkInDate, checkOutDate);

        res.json({
            roomTypeId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            availableRooms: available,
            isAvailable: available > 0,
        });
    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({ error: "Failed to check availability" });
    }
});

// Get default promo code
router.get("/default-promo", async (_req, res) => {
    try {
        const defaultPromo = await PromoCode.findOne({
            isDefault: true,
            status: "active",
        }).lean();

        if (!defaultPromo || !defaultPromo.isValid) {
            return res.json({ promoCode: null });
        }

        res.json({
            promoCode: {
                code: defaultPromo.code,
                name: defaultPromo.name,
                description: defaultPromo.description,
                discountType: defaultPromo.discountType,
                discountValue: defaultPromo.discountValue,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch default promo code" });
    }
});

// Validate promo code
router.post("/validate-promo", async (req, res) => {
    try {
        const { code, roomTypeId, nights, totalAmount } = req.body;

        if (!code) {
            return res.status(400).json({ error: "Promo code is required" });
        }

        const promoCode = await PromoCode.findOne({
            code: code.toUpperCase(),
        }).lean();

        if (!promoCode) {
            return res.status(404).json({ error: "Invalid promo code" });
        }

        // Check if valid
        if (promoCode.status !== "active") {
            return res.status(400).json({ error: "This promo code is no longer active" });
        }

        const now = new Date();
        if (promoCode.validFrom && now < promoCode.validFrom) {
            return res.status(400).json({ error: "This promo code is not yet valid" });
        }
        if (promoCode.validTo && now > promoCode.validTo) {
            return res.status(400).json({ error: "This promo code has expired" });
        }

        if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
            return res.status(400).json({ error: "This promo code has reached its usage limit" });
        }

        // Check minimum requirements
        if (nights && promoCode.minNights && nights < promoCode.minNights) {
            return res.status(400).json({
                error: `This promo code requires a minimum of ${promoCode.minNights} nights`,
            });
        }

        if (totalAmount && promoCode.minAmount && totalAmount < promoCode.minAmount) {
            return res.status(400).json({
                error: `This promo code requires a minimum booking amount of ${promoCode.minAmount}`,
            });
        }

        // Check room type restriction
        if (
            roomTypeId &&
            promoCode.applicableRoomTypes &&
            promoCode.applicableRoomTypes.length > 0
        ) {
            const isApplicable = promoCode.applicableRoomTypes.some(
                (id) => id.toString() === roomTypeId
            );
            if (!isApplicable) {
                return res.status(400).json({
                    error: "This promo code is not applicable to the selected room type",
                });
            }
        }

        // Calculate discount
        let discount = 0;
        if (totalAmount) {
            if (promoCode.discountType === "percentage") {
                discount = (totalAmount * promoCode.discountValue) / 100;
            } else {
                discount = Math.min(promoCode.discountValue, totalAmount);
            }
        }

        res.json({
            valid: true,
            promoCode: {
                id: promoCode._id,
                code: promoCode.code,
                name: promoCode.name,
                description: promoCode.description,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
            },
            discount,
            finalAmount: totalAmount ? totalAmount - discount : 0,
        });
    } catch (error) {
        console.error("Error validating promo code:", error);
        res.status(500).json({ error: "Failed to validate promo code" });
    }
});

// Create a new booking (PUBLIC + ADMIN)
router.post("/bookings", async (req, res) => {
    try {
        console.log("[bookings] POST /bookings", {
            roomTypeId: req.body?.roomTypeId,
            checkInDate: req.body?.checkInDate,
            checkOutDate: req.body?.checkOutDate,
            guestEmail: req.body?.guestEmail,
        });
        const {
            roomTypeId,
            individualRoomId,
            checkInDate,
            checkOutDate,
            guestName,
            guestEmail,
            guestPhone,
            numberOfGuests,
            promoCode,
            specialRequests,
            status,
            paymentStatus,
        } = req.body;

        // Validation
        if (!roomTypeId || !checkInDate || !checkOutDate || !guestName || !guestEmail || !guestPhone) {
            return res.status(400).json({
                error: "Missing required fields",
            });
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        if (checkIn >= checkOut) {
            return res.status(400).json({
                error: "Check-out date must be after check-in date",
            });
        }

        // Check if room type exists
        const room = await Room.findById(roomTypeId);
        if (!room) {
            return res.status(404).json({ error: "Room type not found" });
        }

        // Check availability
        const available = await checkRoomAvailability(roomTypeId, checkIn, checkOut);
        if (available <= 0) {
            return res.status(400).json({
                error: "No rooms available for the selected dates",
            });
        }

        // Calculate nights and base price
        const nights = calculateNights(checkIn, checkOut);
        const roomPrice = room.pricePerNight * nights;

        // Handle promo code
        let discount = 0;
        let promoCodeDoc = null;
        if (promoCode) {
            promoCodeDoc = await PromoCode.findOne({
                code: promoCode.toUpperCase(),
                status: "active",
            });

            if (promoCodeDoc && promoCodeDoc.isValid()) {
                // Verify restrictions
                if (nights >= (promoCodeDoc.minNights || 1) &&
                    roomPrice >= (promoCodeDoc.minAmount || 0)) {
                    discount = promoCodeDoc.calculateDiscount(roomPrice);
                }
            }
        }

        const totalPrice = roomPrice - discount;

        // Handle individual room assignment
        let assignedIndividualRoom = null;
        if (individualRoomId) {
            // Admin specified a room - validate it exists and is available
            const requestedRoom = await IndividualRoom.findById(individualRoomId);
            if (requestedRoom && requestedRoom.roomTypeId.toString() === roomTypeId) {
                // Check if this specific room is available
                const conflictingBooking = await Booking.findOne({
                    individualRoomId: individualRoomId,
                    status: { $in: ["confirmed", "checked-in"] },
                    checkInDate: { $lt: checkOut },
                    checkOutDate: { $gt: checkIn },
                });
                if (conflictingBooking) {
                    return res.status(400).json({
                        error: "The selected room is not available for these dates",
                    });
                }
                assignedIndividualRoom = requestedRoom;
            }
        } else {
            // Try to auto-assign an individual room
            assignedIndividualRoom = await findAvailableIndividualRoom(
                roomTypeId,
                checkIn,
                checkOut
            );
        }

        const resolvedStatus = status || "pending";
        const resolvedPaymentStatus = paymentStatus || "unpaid";

        // Create booking
        const booking = await Booking.create({
            roomTypeId,
            individualRoomId: assignedIndividualRoom?._id || null,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            nights,
            guestName,
            guestEmail,
            guestPhone,
            numberOfGuests: numberOfGuests || 1,
            roomPrice,
            promoCode: promoCode || "",
            promoCodeId: promoCodeDoc?._id || null,
            discount,
            totalPrice,
            status: resolvedStatus, // Admin can set status, default to pending
            paymentStatus: resolvedPaymentStatus, // Admin can set payment status
            specialRequests: specialRequests || "",
        });

        // Increment promo code usage
        if (promoCodeDoc) {
            promoCodeDoc.usedCount += 1;
            await promoCodeDoc.save();
        }

        // Populate room details for response
        const populatedBooking = await Booking.findById(booking._id)
            .populate("roomTypeId")
            .populate("individualRoomId")
            .lean();

        // Create Google Calendar event
        try {
            const calendarId = process.env.BOOKING_CALENDAR_ID || 'primary';
            const eventId = await createBookingEvent(
                {
                    ...booking.toObject(),
                    individualRoomId: assignedIndividualRoom || null,
                },
                room,
                calendarId
            );
            booking.calendarEventId = eventId;
            await booking.save();
        } catch (calError) {
            console.error('Failed to create calendar event:', calError);
            // Continue even if calendar creation fails
        }

        if (resolvedPaymentStatus === "paid") {
            // Send confirmation email to customer only after payment is completed
            try {
                await sendBookingConfirmation(
                    booking.toObject(),
                    room,
                    assignedIndividualRoom
                );
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Continue even if email fails - booking is still created
            }
        }

        // TODO: Send admin notification via Socket.io
        console.log("[bookings] Created booking", {
            bookingNumber: booking.bookingNumber,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
        });

        res.status(201).json({
            booking: {
                id: populatedBooking._id,
                bookingNumber: populatedBooking.bookingNumber,
                roomType: {
                    id: populatedBooking.roomTypeId._id,
                    name: populatedBooking.roomTypeId.name,
                },
                individualRoom: populatedBooking.individualRoomId
                    ? {
                        roomNumber: populatedBooking.individualRoomId.roomNumber,
                        floor: populatedBooking.individualRoomId.floor,
                    }
                    : null,
                checkInDate: populatedBooking.checkInDate,
                checkOutDate: populatedBooking.checkOutDate,
                nights: populatedBooking.nights,
                guestName: populatedBooking.guestName,
                guestEmail: populatedBooking.guestEmail,
                guestPhone: populatedBooking.guestPhone,
                numberOfGuests: populatedBooking.numberOfGuests,
                roomPrice: populatedBooking.roomPrice,
                discount: populatedBooking.discount,
                totalPrice: populatedBooking.totalPrice,
                status: populatedBooking.status,
                createdAt: populatedBooking.createdAt,
            },
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ error: "Failed to create booking" });
    }
});

// Get booking by booking number (PUBLIC - for guest lookup)
router.get("/bookings/lookup/:bookingNumber", async (req, res) => {
    try {
        console.log("[bookings] GET /bookings/lookup", {
            bookingNumber: req.params.bookingNumber,
            locale: req.query?.locale,
        });
        const locale = req.query.locale;
        const booking = await Booking.findOne({
            bookingNumber: req.params.bookingNumber,
        })
            .populate("roomTypeId")
            .populate("individualRoomId")
            .lean();

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json({
            booking: {
                bookingNumber: booking.bookingNumber,
                roomType: {
                    name: locale
                        ? getLangString(booking.roomTypeId.name, locale)
                        : booking.roomTypeId.name,
                    coverImage: booking.roomTypeId.coverImage,
                },
                individualRoom: booking.individualRoomId
                    ? {
                        roomNumber: booking.individualRoomId.roomNumber,
                        floor: booking.individualRoomId.floor,
                    }
                    : null,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                nights: booking.nights,
                guestName: booking.guestName,
                numberOfGuests: booking.numberOfGuests,
                totalPrice: booking.totalPrice,
                status: booking.status,
                specialRequests: booking.specialRequests,
                createdAt: booking.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch booking" });
    }
});

// ==================== ADMIN ROUTES ====================

// Get all bookings (ADMIN)
router.get("/bookings", requireAdmin, async (req, res) => {
    try {
        const filter = {};

        // Filter by status
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Filter by date range
        if (req.query.from) {
            filter.checkInDate = { $gte: new Date(req.query.from) };
        }
        if (req.query.to) {
            filter.checkOutDate = { $lte: new Date(req.query.to) };
        }

        // Search by guest name, email, or booking number
        if (req.query.q) {
            const term = String(req.query.q).trim();
            if (term) {
                filter.$or = [
                    { bookingNumber: { $regex: term, $options: "i" } },
                    { guestName: { $regex: term, $options: "i" } },
                    { guestEmail: { $regex: term, $options: "i" } },
                    { guestPhone: { $regex: term, $options: "i" } },
                ];
            }
        }

        const bookings = await Booking.find(filter)
            .populate("roomTypeId")
            .populate("individualRoomId")
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            bookings: bookings.map((b) => ({
                id: b._id,
                bookingNumber: b.bookingNumber,
                roomType: {
                    id: b.roomTypeId._id,
                    name: b.roomTypeId.name,
                },
                individualRoom: b.individualRoomId
                    ? {
                        id: b.individualRoomId._id,
                        roomNumber: b.individualRoomId.roomNumber,
                        floor: b.individualRoomId.floor,
                    }
                    : null,
                checkInDate: b.checkInDate,
                checkOutDate: b.checkOutDate,
                nights: b.nights,
                guestName: b.guestName,
                guestEmail: b.guestEmail,
                guestPhone: b.guestPhone,
                numberOfGuests: b.numberOfGuests,
                roomPrice: b.roomPrice,
                discount: b.discount,
                totalPrice: b.totalPrice,
                status: b.status,
                paymentStatus: b.paymentStatus,
                specialRequests: b.specialRequests,
                internalNotes: b.internalNotes,
                createdAt: b.createdAt,
                updatedAt: b.updatedAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

// Get single booking (ADMIN)
router.get("/bookings/:id", requireAdmin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("roomTypeId")
            .populate("individualRoomId")
            .populate("promoCodeId")
            .lean();

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json({
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                roomType: {
                    id: booking.roomTypeId._id,
                    name: booking.roomTypeId.name,
                    coverImage: booking.roomTypeId.coverImage,
                },
                individualRoom: booking.individualRoomId
                    ? {
                        id: booking.individualRoomId._id,
                        roomNumber: booking.individualRoomId.roomNumber,
                        floor: booking.individualRoomId.floor,
                        building: booking.individualRoomId.building,
                    }
                    : null,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                nights: booking.nights,
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                guestPhone: booking.guestPhone,
                numberOfGuests: booking.numberOfGuests,
                roomPrice: booking.roomPrice,
                promoCode: booking.promoCodeId
                    ? {
                        code: booking.promoCodeId.code,
                        name: booking.promoCodeId.name,
                        discountType: booking.promoCodeId.discountType,
                        discountValue: booking.promoCodeId.discountValue,
                    }
                    : null,
                discount: booking.discount,
                totalPrice: booking.totalPrice,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                paymentMethod: booking.paymentMethod,
                specialRequests: booking.specialRequests,
                internalNotes: booking.internalNotes,
                calendarEventId: booking.calendarEventId,
                cancelledAt: booking.cancelledAt,
                cancellationReason: booking.cancellationReason,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch booking" });
    }
});

// Update booking (ADMIN)
router.put("/bookings/:id", requireAdmin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // If changing dates, check availability
        if (req.body.checkInDate || req.body.checkOutDate) {
            const newCheckIn = req.body.checkInDate
                ? new Date(req.body.checkInDate)
                : booking.checkInDate;
            const newCheckOut = req.body.checkOutDate
                ? new Date(req.body.checkOutDate)
                : booking.checkOutDate;

            const available = await checkRoomAvailability(
                booking.roomTypeId,
                newCheckIn,
                newCheckOut,
                booking._id
            );

            if (available <= 0) {
                return res.status(400).json({
                    error: "No rooms available for the new dates",
                });
            }

            booking.checkInDate = newCheckIn;
            booking.checkOutDate = newCheckOut;
            booking.nights = calculateNights(newCheckIn, newCheckOut);
        }

        // Update other fields
        if (req.body.individualRoomId !== undefined) {
            booking.individualRoomId = req.body.individualRoomId;
        }
        if (req.body.guestName) booking.guestName = req.body.guestName;
        if (req.body.guestEmail) booking.guestEmail = req.body.guestEmail;
        if (req.body.guestPhone) booking.guestPhone = req.body.guestPhone;
        if (req.body.numberOfGuests) {
            booking.numberOfGuests = Number(req.body.numberOfGuests);
        }
        if (req.body.status) booking.status = req.body.status;
        if (req.body.paymentStatus) booking.paymentStatus = req.body.paymentStatus;
        if (req.body.paymentMethod !== undefined) {
            booking.paymentMethod = req.body.paymentMethod;
        }
        if (req.body.specialRequests !== undefined) {
            booking.specialRequests = req.body.specialRequests;
        }
        if (req.body.internalNotes !== undefined) {
            booking.internalNotes = req.body.internalNotes;
        }

        // Handle cancellation
        const wasCancelled = req.body.status === "cancelled" && !booking.cancelledAt;
        if (wasCancelled) {
            booking.cancelledAt = new Date();
            booking.cancellationReason = req.body.cancellationReason || "";
        }

        await booking.save();

        // Update Google Calendar event if exists
        if (booking.calendarEventId) {
            try {
                const calendarId = process.env.BOOKING_CALENDAR_ID || 'primary';
                const room = await Room.findById(booking.roomTypeId);
                const individualRoom = booking.individualRoomId
                    ? await IndividualRoom.findById(booking.individualRoomId)
                    : null;

                await updateBookingEvent(
                    booking.calendarEventId,
                    {
                        ...booking.toObject(),
                        individualRoomId: individualRoom,
                    },
                    room,
                    calendarId
                );
            } catch (calError) {
                console.error('Failed to update calendar event:', calError);
            }
        }

        // Send cancellation email if booking was cancelled
        if (wasCancelled) {
            try {
                const room = await Room.findById(booking.roomTypeId).lean();
                await sendBookingCancellation(
                    booking.toObject(),
                    room,
                    booking.cancellationReason
                );
            } catch (emailError) {
                console.error('Failed to send cancellation email:', emailError);
            }
        }

        const updatedBooking = await Booking.findById(booking._id)
            .populate("roomTypeId")
            .populate("individualRoomId")
            .lean();

        res.json({
            booking: {
                id: updatedBooking._id,
                bookingNumber: updatedBooking.bookingNumber,
                status: updatedBooking.status,
                // ... include other fields as needed
            },
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(400).json({ error: "Failed to update booking" });
    }
});

// Delete booking (ADMIN)
router.delete("/bookings/:id", requireAdmin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).lean();
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Remove from Google Calendar if event exists
        if (booking.calendarEventId) {
            try {
                const calendarId = process.env.BOOKING_CALENDAR_ID || 'primary';
                await deleteBookingEvent(booking.calendarEventId, calendarId);
            } catch (calError) {
                console.error('Failed to delete calendar event:', calError);
            }
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete booking" });
    }
});

module.exports = router;
