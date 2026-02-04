const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");
const { normalizeUploadPath, normalizeUploadsDeep } = require("../utils/helpers");

// Helper function to extract language-specific string
function getLangString(value, locale) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.th || value.en || "";
}

// Helper function to localize service data
function localizeService(service, locale) {
    return {
        ...service,
        title: getLangString(service.title, locale),
        price: getLangString(service.price, locale),
        shortDescription: getLangString(service.shortDescription, locale),
        seo: {
            title: getLangString(service.seo?.title, locale),
            description: getLangString(service.seo?.description, locale),
            image: service.seo?.image || "",
        },
    };
}

// Categories
router.get("/service-categories", async (_req, res) => {
    const categories = await ServiceCategory.find({})
        .sort({ order: 1, name: 1 })
        .lean();
    res.json({
        categories: categories.map((category) => ({
            id: category._id,
            name: category.name,
            slug: category.slug,
            order: category.order,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        })),
    });
});

router.post("/service-categories", async (req, res) => {
    try {
        const payload = {
            name: req.body?.name,
            slug: req.body?.slug,
            order: req.body?.order || 0,
        };
        if (!payload.name || !payload.slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }
        const category = await ServiceCategory.create(payload);
        res.json({ category: { ...category.toObject(), id: category._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create category" });
    }
});

router.put("/service-categories/:id", async (req, res) => {
    try {
        const category = await ServiceCategory.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name: req.body?.name,
                    slug: req.body?.slug,
                    order: req.body?.order || 0,
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

router.delete("/service-categories/:id", async (req, res) => {
    const category = await ServiceCategory.findByIdAndDelete(req.params.id).lean();
    if (!category) {
        return res.status(404).json({ error: "Category not found" });
    }
    await Service.updateMany(
        { categoryId: category._id },
        { $set: { categoryId: null } }
    );
    res.json({ ok: true });
});

// Services
router.get("/services", async (req, res) => {
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
                { title: { $regex: term, $options: "i" } },
                { shortDescription: { $regex: term, $options: "i" } },
            ];
        }
    }
    if (req.query.category) {
        const category = await ServiceCategory.findOne({
            slug: String(req.query.category),
        }).lean();
        if (!category) {
            return res.json({ services: [] });
        }
        filter.categoryId = category._id;
    }
    const services = await Service.find(filter)
        .populate("categoryId")
        .sort({ updatedAt: -1 })
        .lean();

    const mappedServices = services.map((service) => {
        const baseService = {
            id: service._id,
            title: service.title,
            slug: service.slug,
            status: service.status,
            category: service.categoryId
                ? {
                    id: service.categoryId._id,
                    name: service.categoryId.name,
                    slug: service.categoryId.slug,
                }
                : null,
            price: service.price,
            shortDescription: service.shortDescription,
            rating: service.rating,
            reviewCount: service.reviewCount,
            coverImage: service.coverImage,
            gallery: service.gallery,
            videos: service.videos,
            seo: service.seo,
            publishedAt: service.publishedAt,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        };

        // If admin mode, return full data. Otherwise, localize.
        return isAdmin ? baseService : localizeService(baseService, locale);
    });

    res.json({ services: mappedServices });
});

router.get("/services/:slug", async (req, res) => {
    const preview = req.query.preview === "1";
    const locale = req.query.locale;
    const isAdmin = preview || !locale;

    // Check if the parameter is a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.slug);

    const query = isObjectId
        ? { _id: req.params.slug }
        : { slug: req.params.slug };

    if (!preview) {
        query.status = "published";
    }
    const service = await Service.findOne(query).populate("categoryId").lean();
    if (!service) {
        return res.status(404).json({ error: "Service not found" });
    }

    let serviceData = {
        ...service,
        id: service._id,
        category: service.categoryId
            ? {
                id: service.categoryId._id,
                name: service.categoryId.name,
                slug: service.categoryId.slug,
            }
            : null,
    };

    // If not admin and locale is provided, localize the service
    if (!isAdmin && locale) {
        serviceData = localizeService(serviceData, locale);
    }

    res.json({ service: serviceData });
});

router.post("/services", async (req, res) => {
    try {
        const status = req.body?.status || "draft";
        const payload = {
            title: req.body?.title,
            slug: req.body?.slug,
            status,
            categoryId: req.body?.categoryId || null,
            price: req.body?.price || "",
            shortDescription: req.body?.shortDescription || "",
            rating: Number(req.body?.rating || 0),
            reviewCount: Number(req.body?.reviewCount || 0),
            coverImage: normalizeUploadPath(req.body?.coverImage || ""),
            gallery: Array.isArray(req.body?.gallery)
                ? req.body.gallery.map((item) => normalizeUploadPath(item))
                : [],
            videos: Array.isArray(req.body?.videos) ? req.body.videos : [],
            content: normalizeUploadsDeep(req.body?.content || {}),
            seo: normalizeUploadsDeep(req.body?.seo || {}),
            publishedAt: status === "published" ? new Date() : null,
        };
        if (!payload.title || !payload.slug) {
            return res.status(400).json({ error: "Title and slug are required" });
        }
        const service = await Service.create(payload);
        res.json({ service: { ...service.toObject(), id: service._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create service" });
    }
});

router.put("/services/:id", async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
        return res.status(404).json({ error: "Service not found" });
    }
    const nextStatus = req.body?.status ?? service.status;
    let nextPublishedAt = service.publishedAt;
    if (nextStatus === "published" && !service.publishedAt) {
        nextPublishedAt = new Date();
    }
    if (nextStatus !== "published") {
        nextPublishedAt = null;
    }
    service.title = req.body?.title ?? service.title;
    service.slug = req.body?.slug ?? service.slug;
    service.status = nextStatus;
    service.categoryId = req.body?.categoryId ?? service.categoryId;
    service.price = req.body?.price ?? service.price;
    service.shortDescription = req.body?.shortDescription ?? service.shortDescription;
    service.rating = Number(req.body?.rating ?? service.rating);
    service.reviewCount = Number(req.body?.reviewCount ?? service.reviewCount);
    service.coverImage = req.body?.coverImage
        ? normalizeUploadPath(req.body?.coverImage)
        : service.coverImage;
    service.gallery = Array.isArray(req.body?.gallery)
        ? req.body.gallery.map((item) => normalizeUploadPath(item))
        : service.gallery;
    service.videos = Array.isArray(req.body?.videos)
        ? req.body.videos
        : service.videos;
    service.content = req.body?.content
        ? normalizeUploadsDeep(req.body?.content)
        : service.content;
    service.seo = req.body?.seo
        ? normalizeUploadsDeep(req.body?.seo)
        : service.seo;
    service.publishedAt = nextPublishedAt;
    await service.save();
    res.json({ service: { ...service.toObject(), id: service._id } });
});

router.delete("/services/:id", async (req, res) => {
    const service = await Service.findByIdAndDelete(req.params.id).lean();
    if (!service) {
        return res.status(404).json({ error: "Service not found" });
    }
    res.json({ ok: true });
});

module.exports = router;
