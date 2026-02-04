const mongoose = require("mongoose");

const compareCellSchema = new mongoose.Schema(
    {
        value: { type: String, default: "" },
        href: { type: String, default: "" },
    },
    { _id: false }
);

const compareTableSchema = new mongoose.Schema(
    {
        heading: { type: String, default: "" },
        subheading: { type: String, default: "" },
        columns: { type: [String], default: [] },
        rows: { type: [[compareCellSchema]], default: [] },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        // Name supports both string (legacy) and multi-language object
        name: { type: mongoose.Schema.Types.Mixed, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        code: { type: String, default: "" },
        btu: { type: String, default: "" },
        status: { type: String, default: "draft", index: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductCategory",
            default: null,
        },
        // Description supports multi-language (stored as object for legacy compatibility)
        description: { type: Object, default: {} },
        // Features: Map where each key's value can be string or {th, en}
        features: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
        // Highlights: Array where each item can be string or {th, en}
        highlights: { type: [mongoose.Schema.Types.Mixed], default: [] },
        warranty: {
            // Warranty texts support multi-language
            device: { type: mongoose.Schema.Types.Mixed, default: "" },
            compressor: { type: mongoose.Schema.Types.Mixed, default: "" },
        },
        // InBox: Array where each item can be string or {th, en}
        inBox: { type: [mongoose.Schema.Types.Mixed], default: [] },
        price: {
            device: { type: Number, default: 0 },
            installation: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        images: { type: [String], default: [] },
        seo: {
            // SEO fields support multi-language
            title: { type: mongoose.Schema.Types.Mixed, default: "" },
            description: { type: mongoose.Schema.Types.Mixed, default: "" },
            image: { type: String, default: "" },
        },
        compareTable: { type: compareTableSchema, default: () => ({}) },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Product", productSchema);
