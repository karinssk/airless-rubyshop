const mongoose = require("mongoose");

const productCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        logo: { type: String, default: "" },
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory", default: null },
        order: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("ProductCategory", productCategorySchema);
