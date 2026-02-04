
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:asggesfsdfewews552266955sopkjf@127.0.0.1:27017/room-reservation-services?authSource=admin";
const mongoose = require("mongoose");
const Room = require("../models/Room");
const RoomCategory = require("../models/RoomCategory");
const IndividualRoom = require("../models/IndividualRoom");
const readline = require("readline");

// Setup readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function connectDB() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI is missing");
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

async function deleteRoom(identifier) {
    // Try to find by ID first, then slug
    let query = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { slug: identifier };

    const room = await Room.findOne(query);
    if (!room) {
        console.log(`❌ Room not found: ${identifier}`);
        return;
    }

    console.log(`\nFound Room:`);
    console.log(`- ID: ${room._id}`);
    console.log(`- Name: ${JSON.stringify(room.name)}`);
    console.log(`- Slug: ${room.slug}`);
    console.log(`- Status: ${room.status}`);

    const confirm = await question(`\n⚠️  Are you sure you want to DELETE this room and its IndividualRooms? (yes/no): `);
    if (confirm.toLowerCase() !== "yes") {
        console.log("Creation aborted.");
        return;
    }

    // Delete IndividualRooms first
    const irResult = await IndividualRoom.deleteMany({ roomTypeId: room._id });
    console.log(`Deleted ${irResult.deletedCount} IndividualRooms.`);

    // Delete Room
    await Room.deleteOne({ _id: room._id });
    console.log(`✅ Room deleted successfully.`);
}

async function deleteCategory(identifier) {
    let query = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { slug: identifier };

    const cat = await RoomCategory.findOne(query);
    if (!cat) {
        console.log(`❌ Category not found: ${identifier}`);
        return;
    }

    console.log(`\nFound Category:`);
    console.log(`- ID: ${cat._id}`);
    console.log(`- Name: ${JSON.stringify(cat.name)}`);
    console.log(`- Slug: ${cat.slug}`);

    // Check if rooms are using this category
    const roomCount = await Room.countDocuments({ categoryId: cat._id });
    if (roomCount > 0) {
        console.log(`\n⚠️  WARNING: There are ${roomCount} rooms assigned to this category.`);
        console.log(`If you delete this category, those rooms will have categoryId set to NULL.`);
    }

    const confirm = await question(`\n⚠️  Are you sure you want to DELETE this category? (yes/no): `);
    if (confirm.toLowerCase() !== "yes") {
        console.log("Deletion aborted.");
        return;
    }

    // Unlink rooms
    if (roomCount > 0) {
        await Room.updateMany({ categoryId: cat._id }, { $set: { categoryId: null } });
        console.log(`Unlinked ${roomCount} rooms from this category.`);
    }

    // Delete Category
    await RoomCategory.deleteOne({ _id: cat._id });
    console.log(`✅ Category deleted successfully.`);
}

async function deleteAllRooms() {
    const count = await Room.countDocuments({});
    if (count === 0) {
        console.log("No rooms to delete.");
        return;
    }

    const confirm = await question(`\n⚠️  WARNING: You are about to DELETE ALL ${count} ROOMS. This cannot be undone.\nType "DELETE ALL" to confirm: `);
    if (confirm !== "DELETE ALL") {
        console.log("Operation aborted.");
        return;
    }

    console.log("Deleting all individual rooms...");
    await IndividualRoom.deleteMany({});

    console.log("Deleting all rooms...");
    await Room.deleteMany({});

    console.log("✅ All rooms deleted successfully.");
}

async function deleteAllCategories() {
    const count = await RoomCategory.countDocuments({});
    if (count === 0) {
        console.log("No categories to delete.");
        return;
    }

    const confirm = await question(`\n⚠️  WARNING: You are about to DELETE ALL ${count} CATEGORIES. This cannot be undone.\nType "DELETE ALL CATEGORIES" to confirm: `);
    if (confirm !== "DELETE ALL CATEGORIES") {
        console.log("Operation aborted.");
        return;
    }

    // Unlink rooms first (set categoryId to null for all rooms)
    const roomCount = await Room.countDocuments({ categoryId: { $ne: null } });
    if (roomCount > 0) {
        console.log(`Unlinking ${roomCount} rooms from their categories...`);
        await Room.updateMany({}, { $set: { categoryId: null } });
    }

    console.log("Deleting all categories...");
    await RoomCategory.deleteMany({});

    console.log("✅ All categories deleted successfully.");
}

async function main() {
    await connectDB();

    console.log("\n--- Delete Utility ---");
    console.log("1. Delete Room");
    console.log("2. Delete Category");
    console.log("3. Delete ALL Rooms");
    console.log("4. Delete ALL Categories");
    console.log("5. Exit");

    const choice = await question("\nSelect option (1-5): ");

    switch (choice.trim()) {
        case "1":
            const roomInput = await question("Enter Room Slug or ID: ");
            if (roomInput.trim()) await deleteRoom(roomInput.trim());
            break;
        case "2":
            const catInput = await question("Enter Category Slug or ID: ");
            if (catInput.trim()) await deleteCategory(catInput.trim());
            break;
        case "3":
            await deleteAllRooms();
            break;
        case "4":
            await deleteAllCategories();
            break;
        case "5":
            console.log("Bye!");
            break;
        default:
            console.log("Invalid option");
    }

    rl.close();
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(console.error);
