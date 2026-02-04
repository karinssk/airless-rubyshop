const mongoose = require("mongoose");

const pageBlockSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        props: { type: Object, default: {} },
    },
    { _id: false }
);

const pageSchema = new mongoose.Schema(
    {
        title: {
            th: { type: String, required: true },
            en: { type: String, default: "" }
        },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: String, default: "draft", index: true },
        seo: {
            title: {
                th: { type: String, default: "" },
                en: { type: String, default: "" }
            },
            description: {
                th: { type: String, default: "" },
                en: { type: String, default: "" }
            },
            image: { type: String, default: "" },
        },
        theme: {
            background: { type: String, default: "" },
        },
        // Layout supports both formats: language-specific or legacy
        layout: {
            type: mongoose.Schema.Types.Mixed,
            default: { th: [], en: [] }
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Page", pageSchema);
