const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");

const seedAdminUsers = async () => {
    const ownerEmail =
        (process.env.OWNER_EMAIL || "owner@rcaaircon.com").toLowerCase();
    const ownerPassword = process.env.OWNER_PASSWORD || "owner1234";
    const testEmail =
        (process.env.ADMIN_TEST_EMAIL || "customer123@gmail.com").toLowerCase();
    const testPassword = process.env.ADMIN_TEST_PASSWORD || "258369";

    const ownerExists = await AdminUser.findOne({ email: ownerEmail });
    if (!ownerExists) {
        const passwordHash = await bcrypt.hash(ownerPassword, 10);
        await AdminUser.create({
            email: ownerEmail,
            passwordHash,
            role: "owner",
            status: "approved",
            provider: "password",
            name: "Owner",
        });
    }

    const testExists = await AdminUser.findOne({ email: testEmail });
    if (!testExists) {
        const passwordHash = await bcrypt.hash(testPassword, 10);
        await AdminUser.create({
            email: testEmail,
            passwordHash,
            role: "admin",
            status: "approved",
            provider: "password",
            name: "Test Admin",
        });
    }
};

module.exports = seedAdminUsers;
