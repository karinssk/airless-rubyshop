const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const readline = require("readline");

const MONGO_URI = "mongodb://admin:asggesfsdfewews552266955sopkjf@127.0.0.1:27017/room-reservation-services?authSource=admin";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function connectDB() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI is missing in .env");
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`✅ Connected to MongoDB at ${MONGO_URI.split("@").pop()}`); // Hide creds
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

async function dropDatabase() {
    const confirm = await question("\n⚠️  DANGER: This will delete the ENTIRE database. This cannot be undone.\nType 'DELETE EVERYTHING' to confirm: ");
    if (confirm !== "DELETE EVERYTHING") {
        console.log("Aborted.");
        return;
    }
    await mongoose.connection.db.dropDatabase();
    console.log("💥 Database dropped successfully.");
}

async function clearDataPreserveAdmins() {
    const confirm = await question("\n⚠️  WARNING: This will delete ALL data (Rooms, Bookings, etc.) EXCEPT Admin Accounts.\nType 'CLEAR DATA' to confirm: ");
    if (confirm !== "CLEAR DATA") {
        console.log("Aborted.");
        return;
    }

    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
        // Mongoose usually pluralizes and lowercases, e.g. 'AdminUser' -> 'adminusers'
        // We preserve 'adminusers'
        if (collection.collectionName === "adminusers") {
            console.log(`🛡️  Skipping (preserved): ${collection.collectionName}`);
            continue;
        }

        // Skip system collections if any
        if (collection.collectionName.startsWith("system.")) {
            continue;
        }

        try {
            await collection.deleteMany({});
            console.log(`🗑️  Cleared: ${collection.collectionName}`);
        } catch (err) {
            console.error(`❌ Failed to clear ${collection.collectionName}:`, err.message);
        }
    }
    console.log("✅ Data cleared (Admins preserved).");
}

async function main() {
    await connectDB();

    console.log("\n--- 🧨 Database Reset Utility 🧨 ---");
    console.log("This script helps you empty the database.");
    console.log("1. 💥 Drop ENTIRE Database (Everything gone)");
    console.log("2. 🧹 Clear All Data but KEEP Admins (Good for development reset)");
    console.log("3. Exit");

    const choice = await question("\nSelect option (1-3): ");

    switch (choice.trim()) {
        case "1":
            await dropDatabase();
            break;
        case "2":
            await clearDataPreserveAdmins();
            break;
        case "3":
            console.log("Bye!");
            break;
        default:
            console.log("Invalid option");
    }

    rl.close();
    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
