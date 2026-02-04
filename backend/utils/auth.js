const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

const ADMIN_JWT_SECRET =
    process.env.ADMIN_JWT_SECRET || "rca-admin-secret";

const signAdminToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role, status: user.status },
        ADMIN_JWT_SECRET,
        { expiresIn: "7d" }
    );

const upsertOAuthAdmin = async ({ email, name, provider }) => {
    let user = await AdminUser.findOne({ email });
    if (!user) {
        user = await AdminUser.create({
            email,
            name: name || "",
            role: "admin",
            status: "pending",
            provider,
        });
    }
    return user;
};

const requireAdmin = async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: "Missing token" });
    }
    try {
        const payload = jwt.verify(token, ADMIN_JWT_SECRET);
        const user = await AdminUser.findById(payload.id).lean();
        if (!user) {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (user.status !== "approved") {
            return res.status(403).json({ error: "Pending approval" });
        }
        req.adminUser = user;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};

const requireOwner = (req, res, next) => {
    if (!req.adminUser || req.adminUser.role !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
    }
    next();
};

module.exports = {
    ADMIN_JWT_SECRET,
    signAdminToken,
    upsertOAuthAdmin,
    requireAdmin,
    requireOwner,
};
