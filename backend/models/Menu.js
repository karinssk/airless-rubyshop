const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        // Label supports both string (legacy) and multi-language object
        label: { type: mongoose.Schema.Types.Mixed, required: true },
        href: { type: String, required: true },
        children: { type: [Object], default: [] },
    },
    { _id: false }
);

const contactBarItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        icon: { type: String, required: true },
        // Text supports both string (legacy) and multi-language object
        text: { type: mongoose.Schema.Types.Mixed, required: true },
        link: { type: String, default: "" },
    },
    { _id: false }
);

const menuSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        items: { type: [menuItemSchema], default: [] },
        logoUrl: { type: String, default: "" },
        cta: {
            // CTA label supports both string (legacy) and multi-language object
            label: { type: mongoose.Schema.Types.Mixed, default: "Book Appointment" },
            href: { type: String, default: "#booking" },
        },
        contactBar: {
            enabled: { type: Boolean, default: false },
            backgroundColor: { type: String, default: "#f8f9fa" },
            textColor: { type: String, default: "#000000" },
            items: { type: [contactBarItemSchema], default: [] },
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Menu", menuSchema);
