const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

const seedOwner = async () => {
  try {
    console.log("Connecting to MongoDB...");
    const mongoUri =
        process.env.MONGO_URI ||
        "mongodb://admin_ruby168:258369ss@127.0.0.1:27017/airless-db?authSource=admin";
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    const email = "user_owner@gmail.com";
    const password = "258369";
    const role = "owner";
    const status = "approved";

    const existingUser = await AdminUser.findOne({ email });
    const passwordHash = await bcrypt.hash(password, 10);

    if (existingUser) {
      console.log(`User ${email} exists. Updating...`);
      existingUser.passwordHash = passwordHash;
      existingUser.role = role;
      existingUser.status = status;
      existingUser.provider = "password";
      await existingUser.save();
      console.log("User updated.");
    } else {
      console.log(`Creating new user ${email}...`);
      await AdminUser.create({
        email,
        passwordHash,
        role,
        status,
        name: "Owner",
        provider: "password",
      });
      console.log("User created.");
    }

    await mongoose.disconnect();
    console.log("Done.");
  } catch (error) {
    console.error("Error seeding owner:", error);
    process.exit(1);
  }
};

seedOwner();
