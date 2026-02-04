const mongoose = require("mongoose");

const serviceCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("ServiceCategory", serviceCategorySchema);
