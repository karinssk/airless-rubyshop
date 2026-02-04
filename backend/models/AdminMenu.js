const mongoose = require("mongoose");

const adminMenuItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
        href: { type: String, default: "" },
        icon: { type: String, default: "" },
        permission: { type: String, default: "everyone" },
        children: { type: [Object], default: [] },
    },
    { _id: false }
);

const adminMenuSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        items: { type: [adminMenuItemSchema], default: [] },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("AdminMenu", adminMenuSchema);
