const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const RoomCategory = require("../models/RoomCategory");
const IndividualRoom = require("../models/IndividualRoom");
const Booking = require("../models/Booking");
const { normalizeUploadPath, normalizeUploadsDeep } = require("../utils/helpers");

// Helper function to extract language-specific string
function getLangString(value, locale) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.th || value.en || "";
}

// Helper function to localize room data
function localizeRoom(room, locale) {
    return {
        ...room,
        name: getLangString(room.name, locale),
        description: getLangString(room.description, locale),
        shortDescription: getLangString(room.shortDescription, locale),
        beddingOptions: room.beddingOptions?.map((opt) => ({
            type: opt.type,
            description: getLangString(opt.description, locale),
        })) || [],
        seo: {
            title: getLangString(room.seo?.title, locale),
            description: getLangString(room.seo?.description, locale),
            image: room.seo?.image || "",
        },
    };
}

// ==================== ROOM CATEGORIES ====================

router.get("/room-categories", async (_req, res) => {
    try {
        const categories = await RoomCategory.find({})
            .sort({ order: 1, name: 1 })
            .lean();
        res.json({
            categories: categories.map((category) => ({
                id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                order: category.order,
                icon: category.icon,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

router.post("/room-categories", async (req, res) => {
    try {
        const payload = {
            name: req.body?.name,
            slug: req.body?.slug,
            description: req.body?.description || "",
            order: req.body?.order || 0,
            icon: normalizeUploadPath(req.body?.icon || ""),
        };
        if (!payload.name || !payload.slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }
        const category = await RoomCategory.create(payload);
        res.json({ category: { ...category.toObject(), id: category._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create category" });
    }
});

router.put("/room-categories/:id", async (req, res) => {
    try {
        const category = await RoomCategory.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name: req.body?.name,
                    slug: req.body?.slug,
                    description: req.body?.description || "",
                    order: req.body?.order || 0,
                    icon: normalizeUploadPath(req.body?.icon || ""),
                },
            },
            { new: true }
        ).lean();
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }
        res.json({ category: { ...category, id: category._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to update category" });
    }
});

router.delete("/room-categories/:id", async (req, res) => {
    try {
        const category = await RoomCategory.findByIdAndDelete(req.params.id).lean();
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }
        await Room.updateMany(
            { categoryId: category._id },
            { $set: { categoryId: null } }
        );
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete category" });
    }
});

// ==================== ROOMS ====================

// Get all rooms with optional filtering
router.get("/rooms", async (req, res) => {
    try {
        const locale = req.query.locale; // frontend: ?locale=th or ?locale=en
        const isAdmin = !locale; // If no locale, assume admin mode

        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.q) {
            const term = String(req.query.q).trim();
            if (term) {
                filter.$or = [
                    { name: { $regex: term, $options: "i" } },
                    { description: { $regex: term, $options: "i" } },
                ];
            }
        }
        if (req.query.category) {
            const category = await RoomCategory.findOne({
                slug: String(req.query.category),
            }).lean();
            if (!category) {
                return res.json({ rooms: [] });
            }
            filter.categoryId = category._id;
        }

        const rooms = await Room.find(filter)
            .populate("categoryId")
            .sort({ updatedAt: -1 })
            .lean();

        // If availability check is requested (for booking flow)
        let availabilityMap = {};
        if (req.query.checkIn && req.query.checkOut) {
            const checkIn = new Date(req.query.checkIn);
            const checkOut = new Date(req.query.checkOut);

            for (const room of rooms) {
                const available = await checkRoomAvailability(
                    room._id,
                    checkIn,
                    checkOut
                );
                availabilityMap[room._id.toString()] = available;
            }
        }

        const mappedRooms = rooms.map((room) => {
            const baseRoom = {
                _id: room._id, // Include _id for compatibility
                id: room._id,
                name: room.name,
                slug: room.slug,
                roomCode: room.roomCode,
                status: room.status,
                category: room.categoryId
                    ? {
                        id: room.categoryId._id,
                        name: room.categoryId.name,
                        slug: room.categoryId.slug,
                    }
                    : null,
                maxGuests: room.maxGuests,
                maxAdults: room.maxAdults,
                maxChildren: room.maxChildren,
                maxChildAge: room.maxChildAge,
                size: room.size,
                description: room.description,
                shortDescription: room.shortDescription,
                pricePerNight: room.pricePerNight,
                pricePerMonth: room.pricePerMonth,
                coverImage: room.coverImage,
                gallery: room.gallery,
                videos: room.videos,
                beddingOptions: room.beddingOptions,
                facilities: room.facilities,
                totalRooms: room.totalRooms,
                rating: room.rating,
                reviewCount: room.reviewCount,
                seo: room.seo,
                publishedAt: room.publishedAt,
                createdAt: room.createdAt,
                updatedAt: room.updatedAt,
            };

            // Add availability info if requested
            if (availabilityMap[room._id.toString()] !== undefined) {
                baseRoom.availableRooms = availabilityMap[room._id.toString()];
            }

            // If admin mode, return full data. Otherwise, localize.
            return isAdmin ? baseRoom : localizeRoom(baseRoom, locale);
        });

        res.json({ rooms: mappedRooms });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});

// Get single room by slug or ID
router.get("/rooms/:slug", async (req, res) => {
    try {
        const preview = req.query.preview === "1";
        const locale = req.query.locale;
        const isAdmin = preview || !locale;

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.slug);
        const query = isObjectId
            ? { _id: req.params.slug }
            : { slug: req.params.slug };

        if (!isAdmin) {
            query.status = "published";
        }

        const room = await Room.findOne(query).populate("categoryId").lean();
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        let roomData = {
            ...room,
            id: room._id,
            category: room.categoryId
                ? {
                    id: room.categoryId._id,
                    name: room.categoryId.name,
                    slug: room.categoryId.slug,
                }
                : null,
        };

        // Get individual rooms for this type (admin only)
        if (isAdmin) {
            const individualRooms = await IndividualRoom.find({
                roomTypeId: room._id,
            }).lean();
            roomData.individualRooms = individualRooms.map((ir) => ({
                id: ir._id,
                roomNumber: ir.roomNumber,
                floor: ir.floor,
                building: ir.building,
                status: ir.status,
                isActive: ir.isActive,
            }));
        }

        // If not admin and locale is provided, localize the room
        if (!isAdmin && locale) {
            roomData = localizeRoom(roomData, locale);
        }

        res.json({ room: roomData });
    } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ error: "Failed to fetch room" });
    }
});

// Create new room
router.post("/rooms", async (req, res) => {
    try {
        const status = req.body?.status || "draft";
        const payload = {
            name: req.body?.name,
            slug: req.body?.slug,
            roomCode: req.body?.roomCode || "",
            status,
            categoryId: req.body?.categoryId || null,
            maxGuests: Number(req.body?.maxGuests || 2),
            maxAdults: Number(req.body?.maxAdults || 2),
            maxChildren: Number(req.body?.maxChildren || 0),
            maxChildAge: req.body?.maxChildAge !== undefined ? Number(req.body.maxChildAge) : 12,
            size: req.body?.size || "",
            description: req.body?.description || "",
            shortDescription: req.body?.shortDescription || "",
            pricePerNight: Number(req.body?.pricePerNight || 0),
            pricePerMonth: Number(req.body?.pricePerMonth || 0),
            coverImage: normalizeUploadPath(req.body?.coverImage || ""),
            gallery: Array.isArray(req.body?.gallery)
                ? req.body.gallery.map((item) => normalizeUploadPath(item))
                : [],
            videos: Array.isArray(req.body?.videos) ? req.body.videos : [],
            beddingOptions: req.body?.beddingOptions || [],
            facilities: req.body?.facilities || {},
            totalRooms: Number(req.body?.totalRooms || 1),
            rating: Number(req.body?.rating || 0),
            reviewCount: Number(req.body?.reviewCount || 0),
            seo: normalizeUploadsDeep(req.body?.seo || {}),
            publishedAt: status === "published" ? new Date() : null,
        };

        if (!payload.name || !payload.slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }

        const room = await Room.create(payload);
        res.json({ room: { ...room.toObject(), id: room._id } });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(400).json({ error: "Failed to create room" });
    }
});

// Update room
router.put("/rooms/:id", async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        const nextStatus = req.body?.status ?? room.status;
        let nextPublishedAt = room.publishedAt;
        if (nextStatus === "published" && !room.publishedAt) {
            nextPublishedAt = new Date();
        }
        if (nextStatus !== "published") {
            nextPublishedAt = null;
        }

        room.name = req.body?.name ?? room.name;
        room.slug = req.body?.slug ?? room.slug;
        room.roomCode = req.body?.roomCode ?? room.roomCode;
        room.status = nextStatus;
        room.categoryId = req.body?.categoryId ?? room.categoryId;
        room.maxGuests = req.body?.maxGuests !== undefined
            ? Number(req.body.maxGuests)
            : room.maxGuests;
        room.maxAdults = req.body?.maxAdults !== undefined
            ? Number(req.body.maxAdults)
            : room.maxAdults;
        room.maxChildren = req.body?.maxChildren !== undefined
            ? Number(req.body.maxChildren)
            : room.maxChildren;
        room.maxChildAge = req.body?.maxChildAge !== undefined
            ? Number(req.body.maxChildAge)
            : room.maxChildAge;
        room.size = req.body?.size ?? room.size;
        room.description = req.body?.description ?? room.description;
        room.shortDescription = req.body?.shortDescription ?? room.shortDescription;
        room.pricePerNight = req.body?.pricePerNight !== undefined
            ? Number(req.body.pricePerNight)
            : room.pricePerNight;
        room.pricePerMonth = req.body?.pricePerMonth !== undefined
            ? Number(req.body.pricePerMonth)
            : room.pricePerMonth;
        room.coverImage = req.body?.coverImage
            ? normalizeUploadPath(req.body?.coverImage)
            : room.coverImage;
        room.gallery = Array.isArray(req.body?.gallery)
            ? req.body.gallery.map((item) => normalizeUploadPath(item))
            : room.gallery;
        room.videos = Array.isArray(req.body?.videos)
            ? req.body.videos
            : room.videos;
        room.beddingOptions = req.body?.beddingOptions ?? room.beddingOptions;
        room.facilities = req.body?.facilities ?? room.facilities;
        room.totalRooms = req.body?.totalRooms !== undefined
            ? Number(req.body.totalRooms)
            : room.totalRooms;
        room.rating = req.body?.rating !== undefined
            ? Number(req.body.rating)
            : room.rating;
        room.reviewCount = req.body?.reviewCount !== undefined
            ? Number(req.body.reviewCount)
            : room.reviewCount;
        room.seo = req.body?.seo
            ? normalizeUploadsDeep(req.body?.seo)
            : room.seo;
        room.publishedAt = nextPublishedAt;

        await room.save();
        res.json({ room: { ...room.toObject(), id: room._id } });
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(400).json({ error: "Failed to update room" });
    }
});

// Delete room
router.delete("/rooms/:id", async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id).lean();
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }
        // Also delete associated individual rooms
        await IndividualRoom.deleteMany({ roomTypeId: req.params.id });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete room" });
    }
});

// ==================== INDIVIDUAL ROOMS ====================

// Get all individual rooms for a room type
router.get("/rooms/:roomTypeId/individual-rooms", async (req, res) => {
    try {
        const individualRooms = await IndividualRoom.find({
            roomTypeId: req.params.roomTypeId,
        })
            .populate("roomTypeId")
            .sort({ roomNumber: 1 })
            .lean();

        res.json({
            individualRooms: individualRooms.map((ir) => ({
                id: ir._id,
                roomNumber: ir.roomNumber,
                floor: ir.floor,
                building: ir.building,
                status: ir.status,
                notes: ir.notes,
                isActive: ir.isActive,
                roomType: ir.roomTypeId
                    ? {
                        id: ir.roomTypeId._id,
                        name: ir.roomTypeId.name,
                    }
                    : null,
                createdAt: ir.createdAt,
                updatedAt: ir.updatedAt,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch individual rooms" });
    }
});

// Create individual room
router.post("/individual-rooms", async (req, res) => {
    try {
        const payload = {
            roomTypeId: req.body?.roomTypeId,
            roomNumber: req.body?.roomNumber,
            floor: Number(req.body?.floor || 1),
            building: req.body?.building || "",
            status: req.body?.status || "available",
            notes: req.body?.notes || "",
            isActive: req.body?.isActive !== false,
        };

        if (!payload.roomTypeId || !payload.roomNumber) {
            return res.status(400).json({ error: "Room type and room number are required" });
        }

        const individualRoom = await IndividualRoom.create(payload);
        res.json({ individualRoom: { ...individualRoom.toObject(), id: individualRoom._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create individual room" });
    }
});

// Update individual room
router.put("/individual-rooms/:id", async (req, res) => {
    try {
        const individualRoom = await IndividualRoom.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    roomNumber: req.body?.roomNumber,
                    floor: req.body?.floor !== undefined ? Number(req.body.floor) : undefined,
                    building: req.body?.building,
                    status: req.body?.status,
                    notes: req.body?.notes,
                    isActive: req.body?.isActive,
                },
            },
            { new: true, omitUndefined: true }
        ).lean();

        if (!individualRoom) {
            return res.status(404).json({ error: "Individual room not found" });
        }

        res.json({ individualRoom: { ...individualRoom, id: individualRoom._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to update individual room" });
    }
});

// Delete individual room
router.delete("/individual-rooms/:id", async (req, res) => {
    try {
        const individualRoom = await IndividualRoom.findByIdAndDelete(req.params.id).lean();
        if (!individualRoom) {
            return res.status(404).json({ error: "Individual room not found" });
        }
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete individual room" });
    }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Check room availability for a date range
 * Returns the number of available rooms
 */
async function checkRoomAvailability(roomTypeId, checkInDate, checkOutDate) {
    try {
        // Get total rooms of this type
        const room = await Room.findById(roomTypeId).lean();
        if (!room) return 0;

        // Count bookings that overlap with the requested dates
        // A booking overlaps if:
        // - Its check-in is before the requested check-out, AND
        // - Its check-out is after the requested check-in
        const overlappingBookings = await Booking.countDocuments({
            roomTypeId: roomTypeId,
            status: { $in: ["confirmed", "checked-in"] }, // Only count active bookings
            checkInDate: { $lt: checkOutDate },
            checkOutDate: { $gt: checkInDate },
        });

        return Math.max(0, room.totalRooms - overlappingBookings);
    } catch (error) {
        console.error("Error checking availability:", error);
        return 0;
    }
}

// Export the availability check function for use in other routes
router.checkRoomAvailability = checkRoomAvailability;

module.exports = router;
