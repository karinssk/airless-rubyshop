const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
    {
        // Title supports both string (legacy) and multi-language object
        title: { type: mongoose.Schema.Types.Mixed, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: String, default: "draft", index: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceCategory",
            default: null,
        },
        // Price supports multi-language
        price: { type: mongoose.Schema.Types.Mixed, default: "" },
        // Short description supports multi-language
        shortDescription: { type: mongoose.Schema.Types.Mixed, default: "" },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        coverImage: { type: String, default: "" },
        gallery: { type: [String], default: [] },
        videos: { type: [String], default: [] },
        content: { type: Object, default: {} },
        seo: {
            // SEO fields support multi-language
            title: { type: mongoose.Schema.Types.Mixed, default: "" },
            description: { type: mongoose.Schema.Types.Mixed, default: "" },
            image: { type: String, default: "" },
        },
        publishedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Service", serviceSchema);
