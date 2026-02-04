const mongoose = require("mongoose");

const beddingOptionSchema = new mongoose.Schema(
    {
        type: { type: String, default: "" }, // "2 Queens", "1 King", etc.
        description: { type: mongoose.Schema.Types.Mixed, default: "" }, // Multi-lang
    },
    { _id: false }
);

const facilitiesSchema = new mongoose.Schema(
    {
        bathroomFeatures: { type: [String], default: [] },
        climateControl: { type: [String], default: [] },
        entertainment: { type: [String], default: [] },
        generalAmenities: { type: [String], default: [] },
        internet: { type: [String], default: [] },
        kitchenFeatures: { type: [String], default: [] },
        roomFeatures: { type: [String], default: [] },
    },
    { _id: false }
);

const roomSchema = new mongoose.Schema(
    {
        // Basic Info (Multi-language support)
        name: { type: mongoose.Schema.Types.Mixed, required: true }, // {th: "", en: ""}
        slug: { type: String, required: true, unique: true, index: true },
        roomCode: { type: String, default: "" }, // Unique room type code
        status: { type: String, default: "draft", index: true }, // draft, published
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoomCategory",
            default: null,
        },

        // Room Details
        maxGuests: { type: Number, default: 2 },
        maxAdults: { type: Number, default: 2 },
        maxChildren: { type: Number, default: 0 },
        maxChildAge: { type: Number, default: 12 }, // Age limit for children (e.g., 12 years)
        size: { type: String, default: "" }, // "32 sq mtr"
        description: { type: mongoose.Schema.Types.Mixed, default: "" }, // Long description
        shortDescription: { type: mongoose.Schema.Types.Mixed, default: "" },

        // Pricing
        pricePerNight: { type: Number, default: 0 },
        pricePerMonth: { type: Number, default: 0 },

        // Media
        coverImage: { type: String, default: "" },
        gallery: { type: [String], default: [] },
        videos: { type: [String], default: [] },

        // Bedding Configuration
        beddingOptions: { type: [beddingOptionSchema], default: [] },

        // Facilities (categorized)
        facilities: { type: facilitiesSchema, default: () => ({}) },

        // Inventory Management
        totalRooms: { type: Number, default: 1 }, // Total physical rooms of this type

        // Rating & Reviews
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },

        // SEO
        seo: {
            title: { type: mongoose.Schema.Types.Mixed, default: "" },
            description: { type: mongoose.Schema.Types.Mixed, default: "" },
            image: { type: String, default: "" },
        },

        publishedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Room", roomSchema);
