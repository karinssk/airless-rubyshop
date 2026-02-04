const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: String, default: "draft", index: true },
        excerpt: { type: String, default: "" },
        coverImage: { type: String, default: "" },
        tags: { type: [String], default: [] },
        seo: {
            title: { type: String, default: "" },
            description: { type: String, default: "" },
            image: { type: String, default: "" },
        },
        content: { type: Object, default: {} },
        publishedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Post", postSchema);
