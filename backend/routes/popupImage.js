const express = require("express");
const router = express.Router();
const PopupImage = require("../models/PopupImage");
const { requireAdmin } = require("../utils/auth");

const ensurePopupImage = async () => {
    let setting = await PopupImage.findOne().lean();
    if (!setting) {
        setting = await PopupImage.create({
            enabled: false,
            imageUrl: "",
            buttonText: "Click to see promotion",
            buttonLink: "",
        });
    }
    return setting;
};

// GET /popup-image - Public endpoint to fetch popup settings
router.get("/popup-image", async (_req, res) => {
    try {
        const setting = await ensurePopupImage();
        res.json({
            setting: {
                enabled: setting.enabled,
                imageUrl: setting.imageUrl || "",
                buttonText: setting.buttonText || "Click to see promotion",
                buttonLink: setting.buttonLink || "",
            },
        });
    } catch (error) {
        console.error("[popup-image] Failed to fetch popup setting:", error);
        res.status(500).json({ error: "Failed to fetch popup setting" });
    }
});

// PUT /popup-image - Admin endpoint to update popup settings
router.put("/popup-image", requireAdmin, async (req, res) => {
    try {
        console.log("[popup-image] PUT /popup-image", req.body);

        const updateData = {};

        if (typeof req.body?.enabled === "boolean") {
            updateData.enabled = req.body.enabled;
        }
        if (typeof req.body?.imageUrl === "string") {
            updateData.imageUrl = req.body.imageUrl;
        }
        if (typeof req.body?.buttonText === "string") {
            updateData.buttonText = req.body.buttonText;
        }
        if (typeof req.body?.buttonLink === "string") {
            updateData.buttonLink = req.body.buttonLink;
        }

        const setting = await PopupImage.findOneAndUpdate(
            {},
            { $set: updateData },
            { new: true, upsert: true }
        ).lean();

        res.json({
            setting: {
                enabled: setting.enabled,
                imageUrl: setting.imageUrl || "",
                buttonText: setting.buttonText || "Click to see promotion",
                buttonLink: setting.buttonLink || "",
            },
        });
    } catch (error) {
        console.error("[popup-image] Failed to update popup setting:", error);
        res.status(500).json({ error: "Failed to update popup setting" });
    }
});

module.exports = router;
