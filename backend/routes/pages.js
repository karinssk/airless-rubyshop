const express = require("express");
const router = express.Router();
const Page = require("../models/Page");
const { normalizeUploadsDeep } = require("../utils/helpers");

router.get("/", async (req, res) => {
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }
    const pages = await Page.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({
        pages: pages.map((page) => ({
            id: page._id,
            // Return Thai title for the list (or fallback to old format)
            title: page.title?.th || page.title,
            slug: page.slug,
            status: page.status,
            updatedAt: page.updatedAt,
        })),
    });
});

router.get("/:slug", async (req, res) => {
    const preview = req.query.preview === "1";
    const locale = req.query.locale;
    const query = { slug: req.params.slug };
    if (!preview) {
        query.status = "published";
    }
    const page = await Page.findOne(query).lean();
    if (!page) {
        return res.status(404).json({ error: "Page not found" });
    }

    // If preview mode without locale (admin editing), return full object for multi-language editing
    if (preview && !locale) {
        return res.json({
            page: {
                ...page,
                id: page._id
            }
        });
    }

    // Otherwise return locale-specific data for frontend
    const targetLocale = locale || "th";
    const response = {
        ...page,
        id: page._id,
        // Handle title (support both old and new format)
        title: page.title?.[targetLocale] || page.title?.th || page.title,
        // Handle SEO (support both old and new format)
        seo: {
            title: page.seo?.title?.[targetLocale] || page.seo?.title?.th || page.seo?.title || "",
            description: page.seo?.description?.[targetLocale] || page.seo?.description?.th || page.seo?.description || "",
            image: page.seo?.image || ""
        },
        // Handle layout (support both old and new format)
        layout: page.layout?.[targetLocale] || page.layout?.th || page.layout || []
    };

    res.json({ page: response });
});

router.post("/", async (req, res) => {
    try {
        const payload = {
            title: req.body?.title,
            slug: req.body?.slug,
            status: req.body?.status || "draft",
            seo: normalizeUploadsDeep(req.body?.seo || {}),
            theme: normalizeUploadsDeep(req.body?.theme || {}),
            layout: normalizeUploadsDeep(req.body?.layout || []),
        };
        if (!payload.title || !payload.slug) {
            return res.status(400).json({ error: "Title and slug are required" });
        }
        const page = await Page.create(payload);
        res.json({ page: { ...page.toObject(), id: page._id } });
    } catch (error) {
        if (String(error?.code) === "11000") {
            return res.status(409).json({ error: "Slug already exists" });
        }
        res.status(400).json({ error: "Failed to create page" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const payload = {
            title: req.body?.title,
            slug: req.body?.slug,
            status: req.body?.status || "draft",
            seo: normalizeUploadsDeep(req.body?.seo || {}),
            theme: normalizeUploadsDeep(req.body?.theme || {}),
            layout: normalizeUploadsDeep(req.body?.layout || []),
        };
        if (!payload.title || !payload.slug) {
            return res.status(400).json({ error: "Title and slug are required" });
        }
        const page = await Page.findByIdAndUpdate(
            req.params.id,
            { $set: payload },
            { new: true }
        ).lean();
        if (!page) {
            return res.status(404).json({ error: "Page not found" });
        }
        res.json({ page: { ...page, id: page._id } });
    } catch (error) {
        if (String(error?.code) === "11000") {
            return res.status(409).json({ error: "Slug already exists" });
        }
        res.status(400).json({ error: "Failed to update page" });
    }
});

router.delete("/:id", async (req, res) => {
    const page = await Page.findByIdAndDelete(req.params.id).lean();
    if (!page) {
        return res.status(404).json({ error: "Page not found" });
    }
    res.json({ ok: true });
});

module.exports = router;
