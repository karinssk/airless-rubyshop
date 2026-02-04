const mongoose = require("mongoose");

const footerLinkSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
        href: { type: String, default: "" },
    },
    { _id: false }
);

const footerSocialSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
        href: { type: String, default: "" },
        icon: { type: String, default: "" },
    },
    { _id: false }
);

const footerContactSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
        value: { type: String, default: "" },
        href: { type: String, default: "" },
        icon: { type: String, default: "" },
    },
    { _id: false }
);

const footerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        backgroundColor: { type: String, default: "#0b3c86" },
        brand: {
            name: { type: String, default: "RUBYSHOP" },
            description: { type: String, default: "" },
            logoUrl: { type: String, default: "" },
        },
        social: { type: [footerSocialSchema], default: [] },
        services: { type: [footerLinkSchema], default: [] },
        menu: { type: [footerLinkSchema], default: [] },
        contact: { type: [footerContactSchema], default: [] },
        copyright: { type: String, default: "" },
        subfooter: { type: String, default: "" },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Footer", footerSchema);
