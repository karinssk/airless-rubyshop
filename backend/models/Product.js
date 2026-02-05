const mongoose = require("mongoose");

const compareCellSchema = new mongoose.Schema(
    {
        value: { type: mongoose.Schema.Types.Mixed, default: "" },
        href: { type: String, default: "" },
    },
    { _id: false }
);

const compareTableSchema = new mongoose.Schema(
    {
        heading: { type: mongoose.Schema.Types.Mixed, default: "" },
        subheading: { type: mongoose.Schema.Types.Mixed, default: "" },
        columns: { type: [mongoose.Schema.Types.Mixed], default: [] },
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
        // Features: Multi-language object or map (legacy)
        features: { type: mongoose.Schema.Types.Mixed, default: {} },
        // Highlights: Multi-language list or legacy array
        highlights: { type: mongoose.Schema.Types.Mixed, default: [] },
        warranty: {
            // Warranty texts support multi-language
            device: { type: mongoose.Schema.Types.Mixed, default: "" },
            compressor: { type: mongoose.Schema.Types.Mixed, default: "" },
        },
        // InBox: Multi-language list or legacy array
        inBox: { type: mongoose.Schema.Types.Mixed, default: [] },
        price: {
            device: { type: Number, default: 0 },
            installation: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        images: { type: [String], default: [] },
        videoUrl: { type: String, default: "" },
        seo: {
            // SEO fields support multi-language
            title: { type: mongoose.Schema.Types.Mixed, default: "" },
            description: { type: mongoose.Schema.Types.Mixed, default: "" },
            image: { type: String, default: "" },
        },
        compareTable: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Product", productSchema);
