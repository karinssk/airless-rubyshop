const express = require("express");
const router = express.Router();
const PromoCode = require("../models/PromoCode");
const { requireAdmin } = require("../utils/auth");

// Helper function to extract language-specific string
function getLangString(value, locale) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.th || value.en || "";
}

// ==================== PUBLIC ROUTES ====================

// Get active promo codes (PUBLIC - limited info)
router.get("/promo-codes/active", async (req, res) => {
    try {
        const locale = req.query.locale || "th";
        const now = new Date();

        const promoCodes = await PromoCode.find({
            status: "active",
            $or: [
                { validFrom: { $lte: now }, validTo: { $gte: now } },
                { validFrom: { $lte: now }, validTo: null },
            ],
        })
            .select("code name description discountType discountValue isDefault")
            .lean();

        const activeCodes = promoCodes
            .filter((pc) => !pc.maxUses || pc.usedCount < pc.maxUses)
            .map((pc) => ({
                code: pc.code,
                name: getLangString(pc.name, locale),
                description: getLangString(pc.description, locale),
                discountType: pc.discountType,
                discountValue: pc.discountValue,
                isDefault: pc.isDefault,
            }));

        res.json({ promoCodes: activeCodes });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch promo codes" });
    }
});

// ==================== ADMIN ROUTES ====================

// Apply admin authentication middleware for all routes below
// Apply admin authentication middleware for all routes below
// router.use(requireAdmin); // Removed to prevent blocking other routers


// Get all promo codes (ADMIN)
router.get("/promo-codes", requireAdmin, async (req, res) => {
    try {
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.q) {
            const term = String(req.query.q).trim();
            if (term) {
                filter.$or = [
                    { code: { $regex: term, $options: "i" } },
                    { "name.th": { $regex: term, $options: "i" } },
                    { "name.en": { $regex: term, $options: "i" } },
                ];
            }
        }

        const promoCodes = await PromoCode.find(filter)
            .populate("applicableRoomTypes")
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            promoCodes: promoCodes.map((pc) => ({
                id: pc._id,
                code: pc.code,
                name: pc.name,
                description: pc.description,
                discountType: pc.discountType,
                discountValue: pc.discountValue,
                validFrom: pc.validFrom,
                validTo: pc.validTo,
                maxUses: pc.maxUses,
                usedCount: pc.usedCount,
                maxUsesPerUser: pc.maxUsesPerUser,
                minNights: pc.minNights,
                minAmount: pc.minAmount,
                applicableRoomTypes: pc.applicableRoomTypes?.map((rt) => ({
                    id: rt._id,
                    name: rt.name,
                })) || [],
                isDefault: pc.isDefault,
                status: pc.status,
                internalNotes: pc.internalNotes,
                createdAt: pc.createdAt,
                updatedAt: pc.updatedAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching promo codes:", error);
        res.status(500).json({ error: "Failed to fetch promo codes" });
    }
});

// Get single promo code (ADMIN)
router.get("/promo-codes/:id", requireAdmin, async (req, res) => {
    try {
        const promoCode = await PromoCode.findById(req.params.id)
            .populate("applicableRoomTypes")
            .lean();

        if (!promoCode) {
            return res.status(404).json({ error: "Promo code not found" });
        }

        res.json({
            promoCode: {
                id: promoCode._id,
                code: promoCode.code,
                name: promoCode.name,
                description: promoCode.description,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
                validFrom: promoCode.validFrom,
                validTo: promoCode.validTo,
                maxUses: promoCode.maxUses,
                usedCount: promoCode.usedCount,
                maxUsesPerUser: promoCode.maxUsesPerUser,
                minNights: promoCode.minNights,
                minAmount: promoCode.minAmount,
                applicableRoomTypes: promoCode.applicableRoomTypes?.map((rt) => ({
                    id: rt._id,
                    name: rt.name,
                })) || [],
                isDefault: promoCode.isDefault,
                status: promoCode.status,
                internalNotes: promoCode.internalNotes,
                createdAt: promoCode.createdAt,
                updatedAt: promoCode.updatedAt,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch promo code" });
    }
});

// Create promo code (ADMIN)
router.post("/promo-codes", requireAdmin, async (req, res) => {
    try {
        const payload = {
            code: req.body?.code?.toUpperCase(),
            name: req.body?.name || "",
            description: req.body?.description || "",
            discountType: req.body?.discountType,
            discountValue: Number(req.body?.discountValue),
            validFrom: req.body?.validFrom ? new Date(req.body.validFrom) : new Date(),
            validTo: req.body?.validTo ? new Date(req.body.validTo) : null,
            maxUses: req.body?.maxUses !== undefined ? Number(req.body.maxUses) : null,
            maxUsesPerUser: Number(req.body?.maxUsesPerUser || 1),
            minNights: Number(req.body?.minNights || 1),
            minAmount: Number(req.body?.minAmount || 0),
            applicableRoomTypes: Array.isArray(req.body?.applicableRoomTypes)
                ? req.body.applicableRoomTypes
                : [],
            isDefault: req.body?.isDefault === true,
            status: req.body?.status || "active",
            internalNotes: req.body?.internalNotes || "",
        };

        if (!payload.code || !payload.discountType || !payload.discountValue) {
            return res.status(400).json({
                error: "Code, discount type, and discount value are required",
            });
        }

        // If setting as default, remove default from other promo codes
        if (payload.isDefault) {
            await PromoCode.updateMany(
                { isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        const promoCode = await PromoCode.create(payload);
        res.json({ promoCode: { ...promoCode.toObject(), id: promoCode._id } });
    } catch (error) {
        console.error("Error creating promo code:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Promo code already exists" });
        }
        res.status(400).json({ error: "Failed to create promo code" });
    }
});

// Update promo code (ADMIN)
router.put("/promo-codes/:id", requireAdmin, async (req, res) => {
    try {
        const promoCode = await PromoCode.findById(req.params.id);
        if (!promoCode) {
            return res.status(404).json({ error: "Promo code not found" });
        }

        // If setting as default, remove default from other promo codes
        if (req.body?.isDefault === true && !promoCode.isDefault) {
            await PromoCode.updateMany(
                { isDefault: true, _id: { $ne: promoCode._id } },
                { $set: { isDefault: false } }
            );
        }

        if (req.body?.code) promoCode.code = req.body.code.toUpperCase();
        if (req.body?.name !== undefined) promoCode.name = req.body.name;
        if (req.body?.description !== undefined) promoCode.description = req.body.description;
        if (req.body?.discountType) promoCode.discountType = req.body.discountType;
        if (req.body?.discountValue !== undefined) {
            promoCode.discountValue = Number(req.body.discountValue);
        }
        if (req.body?.validFrom) promoCode.validFrom = new Date(req.body.validFrom);
        if (req.body?.validTo !== undefined) {
            promoCode.validTo = req.body.validTo ? new Date(req.body.validTo) : null;
        }
        if (req.body?.maxUses !== undefined) {
            promoCode.maxUses = req.body.maxUses !== null ? Number(req.body.maxUses) : null;
        }
        if (req.body?.maxUsesPerUser !== undefined) {
            promoCode.maxUsesPerUser = Number(req.body.maxUsesPerUser);
        }
        if (req.body?.minNights !== undefined) {
            promoCode.minNights = Number(req.body.minNights);
        }
        if (req.body?.minAmount !== undefined) {
            promoCode.minAmount = Number(req.body.minAmount);
        }
        if (req.body?.applicableRoomTypes !== undefined) {
            promoCode.applicableRoomTypes = Array.isArray(req.body.applicableRoomTypes)
                ? req.body.applicableRoomTypes
                : [];
        }
        if (req.body?.isDefault !== undefined) promoCode.isDefault = req.body.isDefault;
        if (req.body?.status) promoCode.status = req.body.status;
        if (req.body?.internalNotes !== undefined) {
            promoCode.internalNotes = req.body.internalNotes;
        }

        await promoCode.save();
        res.json({ promoCode: { ...promoCode.toObject(), id: promoCode._id } });
    } catch (error) {
        console.error("Error updating promo code:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Promo code already exists" });
        }
        res.status(400).json({ error: "Failed to update promo code" });
    }
});

// Delete promo code (ADMIN)
router.delete("/promo-codes/:id", requireAdmin, async (req, res) => {
    try {
        const promoCode = await PromoCode.findByIdAndDelete(req.params.id).lean();
        if (!promoCode) {
            return res.status(404).json({ error: "Promo code not found" });
        }
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete promo code" });
    }
});

// Reset usage count (ADMIN)
router.post("/promo-codes/:id/reset-usage", requireAdmin, async (req, res) => {
    try {
        const promoCode = await PromoCode.findByIdAndUpdate(
            req.params.id,
            { $set: { usedCount: 0 } },
            { new: true }
        ).lean();

        if (!promoCode) {
            return res.status(404).json({ error: "Promo code not found" });
        }

        res.json({ promoCode: { ...promoCode, id: promoCode._id } });
    } catch (error) {
        res.status(500).json({ error: "Failed to reset usage count" });
    }
});

module.exports = router;
