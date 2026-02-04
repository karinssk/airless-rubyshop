const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

router.get("/", async (req, res) => {
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.q) {
        const term = String(req.query.q).trim();
        if (term) {
            filter.$or = [
                { title: { $regex: term, $options: "i" } },
                { excerpt: { $regex: term, $options: "i" } },
            ];
        }
    }
    const posts = await Post.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({
        posts: posts.map((post) => ({
            id: post._id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            tags: post.tags,
            seo: post.seo,
            publishedAt: post.publishedAt,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        })),
    });
});

router.get("/:slug", async (req, res) => {
    const preview = req.query.preview === "1";
    const query = { slug: req.params.slug };
    if (!preview) {
        query.status = "published";
    }
    const post = await Post.findOne(query).lean();
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    res.json({ post: { ...post, id: post._id } });
});

module.exports = router;
