const path = require("path");
const mongoose = require("mongoose");
const Footer = require("../models/Footer");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const logoUrl = process.argv[2] || "/uploads/logo/rubyshop-nobg.ico";
const brandName = process.argv[3];

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const update = { "brand.logoUrl": logoUrl };
  if (brandName) update["brand.name"] = brandName;

  const footer = await Footer.findOneAndUpdate(
    { name: "main" },
    { $set: update },
    { new: true, upsert: true }
  ).lean();

  console.log("✅ Updated footer brand logo.");
  console.log({
    name: footer?.brand?.name,
    logoUrl: footer?.brand?.logoUrl,
  });

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("❌ Failed to update footer logo:", error);
  process.exit(1);
});
