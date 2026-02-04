const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

const seedCustomer = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const email = "customer_test@gmail.com";
        const password = "258369";
        const role = "customer"; // Creating with 'customer' role
        const status = "approved";

        const existingUser = await AdminUser.findOne({ email });
        if (existingUser) {
            console.log(`User ${email} already exists. Updating password...`);
            const passwordHash = await bcrypt.hash(password, 10);
            existingUser.passwordHash = passwordHash;
            existingUser.role = role;
            existingUser.status = status;
            await existingUser.save();
            console.log("User updated.");
        } else {
            console.log(`Creating new user ${email}...`);
            const passwordHash = await bcrypt.hash(password, 10);
            await AdminUser.create({
                email,
                passwordHash,
                role,
                status,
                name: "Test Customer",
                provider: "password"
            });
            console.log("User created.");
        }

        await mongoose.disconnect();
        console.log("Done.");
    } catch (error) {
        console.error("Error seeding customer:", error);
        process.exit(1);
    }
};

seedCustomer();
