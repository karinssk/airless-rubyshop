const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Product = require("../models/Product");
const ProductCategory = require("../models/ProductCategory");
const { normalizeUploadPath, normalizeUploadsDeep } = require("../utils/helpers");

// Helper function to extract language-specific string
function getLangString(value, locale) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.th || value.en || "";
}

// Helper function to extract language-specific rich text (TipTap JSON)
function getLangDoc(value, locale) {
    if (!value) return {};
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && value.type === "doc") return value;
    if (value && typeof value === "object") {
        return value[locale] || value.th || value.en || {};
    }
    return {};
}

function getLangCompareTable(value, locale) {
    if (!value) return {};
    if (value && typeof value === "object" && (value.th || value.en)) {
        return value[locale] || value.th || value.en || {};
    }
    return value;
}

// Helper function to extract language-specific array items
function getLangArray(arr, locale) {
    if (!arr) return [];
    if (Array.isArray(arr)) {
        return arr.map(item => getLangString(item, locale));
    }
    if (typeof arr === "object") {
        return arr[locale] || arr.th || arr.en || [];
    }
    return [];
}

// Helper function to extract language-specific features (Map)
function getLangFeatures(features, locale) {
    if (!features) return {};
    if (typeof features === "object" && (features.th || features.en)) {
        return features[locale] || features.th || features.en || {};
    }
    const result = {};
    for (const [key, value] of Object.entries(features)) {
        result[key] = getLangString(value, locale);
    }
    return result;
}

// Helper function to localize product data
function localizeProduct(product, locale) {
    return {
        ...product,
        name: getLangString(product.name, locale),
        description: getLangDoc(product.description, locale),
        features: getLangFeatures(product.features, locale),
        highlights: getLangArray(product.highlights, locale),
        warranty: {
            device: getLangString(product.warranty?.device, locale),
            compressor: getLangString(product.warranty?.compressor, locale),
        },
        inBox: getLangArray(product.inBox, locale),
        seo: {
            title: getLangString(product.seo?.title, locale),
            description: getLangString(product.seo?.description, locale),
            image: product.seo?.image || "",
        },
        compareTable: getLangCompareTable(product.compareTable, locale),
    };
}

// Categories
router.get("/product-categories", async (_req, res) => {
    const categories = await ProductCategory.find({})
        .populate("parentId")
        .sort({ order: 1, name: 1 })
        .lean();
    res.json({
        categories: categories.map((c) => ({
            id: c._id,
            name: c.name,
            slug: c.slug,
            logo: c.logo,
            parentId: c.parentId ? c.parentId._id : null,
            parent: c.parentId ? { id: c.parentId._id, slug: c.parentId.slug } : null,
            order: c.order,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        })),
    });
});

router.post("/product-categories", async (req, res) => {
    try {
        const parentId = req.body?.parentId || null;
        if (parentId) {
            const parent = await ProductCategory.findById(parentId).lean();
            if (!parent) {
                return res.status(400).json({ error: "Parent category not found" });
            }
        }
        const payload = {
            name: req.body?.name,
            slug: req.body?.slug,
            logo: req.body?.logo || "",
            parentId,
            order: req.body?.order || 0,
        };
        if (!payload.name || !payload.slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }
        const category = await ProductCategory.create(payload);
        res.json({ category: { ...category.toObject(), id: category._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create category" });
    }
});

router.put("/product-categories/:id", async (req, res) => {
    try {
        const parentId = req.body?.parentId || null;
        if (parentId) {
            if (String(parentId) === String(req.params.id)) {
                return res.status(400).json({ error: "Category cannot be its own parent" });
            }
            let current = await ProductCategory.findById(parentId).lean();
            while (current) {
                if (String(current._id) === String(req.params.id)) {
                    return res.status(400).json({ error: "Parent category creates a cycle" });
                }
                if (!current.parentId) break;
                current = await ProductCategory.findById(current.parentId).lean();
            }
        }
        const category = await ProductCategory.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name: req.body?.name,
                    slug: req.body?.slug,
                    logo: req.body?.logo || "",
                    parentId,
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

router.delete("/product-categories/:id", async (req, res) => {
    const category = await ProductCategory.findByIdAndDelete(req.params.id).lean();
    if (!category) {
        return res.status(404).json({ error: "Category not found" });
    }
    await Product.updateMany(
        { categoryId: category._id },
        { $set: { categoryId: null } }
    );
    res.json({ ok: true });
});

// Products
router.get("/products", async (req, res) => {
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
                { code: { $regex: term, $options: "i" } },
            ];
        }
    }
    if (req.query.category) {
        const categorySlug = String(req.query.category);
        if (categorySlug !== "all") {
            const category = await ProductCategory.findOne({ slug: categorySlug }).lean();
            if (category) {
                filter.categoryId = category._id;
            } else {
                return res.json({ products: [] });
            }
        }
    }
    const products = await Product.find(filter).sort({ updatedAt: -1 }).lean();
    const categoryIds = Array.from(
        new Set(
            products
                .map((p) => p.categoryId)
                .filter((id) => mongoose.isValidObjectId(id))
                .map((id) => String(id))
        )
    );
    const categories = categoryIds.length
        ? await ProductCategory.find({ _id: { $in: categoryIds } }).lean()
        : [];
    const categoryMap = new Map(
        categories.map((category) => [String(category._id), category])
    );

    const mappedProducts = products.map((p) => {
        const category = p.categoryId
            ? categoryMap.get(String(p.categoryId))
            : null;
        const baseProduct = {
            id: p._id,
            name: p.name,
            slug: p.slug,
            code: p.code,
            btu: p.btu,
            status: p.status,
            category: category
                ? { id: category._id, name: category.name, slug: category.slug }
                : null,
            price: p.price,
            images: p.images,
            updatedAt: p.updatedAt,
        };

        return isAdmin ? baseProduct : { ...baseProduct, name: getLangString(p.name, locale) };
    });

    res.json({ products: mappedProducts });
});

router.get("/products/:slug", async (req, res) => {
    const preview = req.query.preview === "1";
    const locale = req.query.locale; // frontend: ?locale=th or ?locale=en
    const isAdmin = preview; // If preview mode, return full data for admin

    const slugOrId = req.params.slug;
    const isObjectId = mongoose.isValidObjectId(slugOrId);
    const query = isObjectId ? { _id: slugOrId } : { slug: slugOrId };
    if (!preview) {
        query.status = "published";
    }
    const p = await Product.findOne(query).lean();
    if (!p) {
        return res.status(404).json({ error: "Product not found" });
    }
    const category = mongoose.isValidObjectId(p.categoryId)
        ? await ProductCategory.findById(p.categoryId).lean()
        : null;

    let product = {
        ...p,
        id: p._id,
        category: category
            ? { id: category._id, name: category.name, slug: category.slug }
            : null,
    };

    // If not admin and locale is provided, localize the product
    if (!isAdmin && locale) {
        product = localizeProduct(product, locale);
    }

    res.json({ product });
});

router.post("/products", async (req, res) => {
    try {
        const status = req.body?.status || "draft";
        const payload = {
            name: req.body?.name,
            slug: req.body?.slug,
            code: req.body?.code || "",
            btu: req.body?.btu || "",
            status,
            categoryId: req.body?.categoryId || null,
            description: req.body?.description || {},
            features: req.body?.features || {},
            highlights: req.body?.highlights || [],
            warranty: req.body?.warranty || { device: "", compressor: "" },
            inBox: req.body?.inBox || [],
            price: req.body?.price || { device: 0, installation: 0, total: 0 },
            images: Array.isArray(req.body?.images)
                ? req.body.images.map((item) => normalizeUploadPath(item))
                : [],
            videoUrl: req.body?.videoUrl || "",
            seo: req.body?.seo || { title: "", description: "", image: "" },
            compareTable: req.body?.compareTable || {
                heading: "",
                subheading: "",
                columns: [],
                rows: [],
            },
        };
        if (!payload.name || !payload.slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }
        const product = await Product.create(payload);
        res.json({ product: { ...product.toObject(), id: product._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to create product" });
    }
});

router.put("/products/:id", async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.images) {
            updates.images = normalizeUploadsDeep(updates.images);
        }
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).lean();
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ product: { ...product, id: product._id } });
    } catch (error) {
        res.status(400).json({ error: "Failed to update product" });
    }
});

router.delete("/products/:id", async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json({ ok: true });
});

module.exports = router;
