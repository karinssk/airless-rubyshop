const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const AdminUser = require("../models/AdminUser");
const {
    upsertOAuthAdmin,
    signAdminToken,
    requireAdmin,
} = require("../utils/auth");
const {
    getOAuthRedirectUrl,
    resolveAdminRedirect,
} = require("../utils/helpers");

// --- DEBUG: Check Environment Variables ---
console.log("--- AUTH ROUTE ENV DEBUG ---");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Loaded" : "MISSING");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Loaded" : "MISSING");
console.log("BACKEND_URL:", process.env.BACKEND_URL);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("ADMIN_URL:", process.env.ADMIN_URL);
console.log("LINE_CLIENT_ID:", process.env.LINE_CLIENT_ID ? "Loaded" : "MISSING");
console.log("LINE_CLIENT_SECRET:", process.env.LINE_CLIENT_SECRET ? "Loaded" : "MISSING");
console.log("LINE_CALLBACK_URL:", process.env.LINE_CALLBACK_URL);
console.log("----------------------------");
// -----------------------------------------

// Login (renamed from /admin/login to avoid ad blockers)
router.post("/auth/staff-signin", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }
    let user = await AdminUser.findOne({ email });
    if (!user) {
        // Auto-register pending admin on first login attempt? 
        // The original code (lines 1196-1212) did this.
        const passwordHash = await bcrypt.hash(password, 10);
        user = await AdminUser.create({
            email,
            passwordHash,
            role: "admin",
            status: "pending",
            provider: "password",
        });
        return res.status(403).json({ status: "pending" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash || "");
    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.status !== "approved") {
        return res.status(403).json({ status: "pending" });
    }
    const token = signAdminToken(user);
    res.json({
        token,
        user: { id: user._id, email: user.email, role: user.role, name: user.name },
    });
});

// OAuth Direct Mock/Handler
router.post("/admin/oauth", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const provider = String(req.body?.provider || "").trim().toLowerCase();
    const name = String(req.body?.name || "").trim();
    if (!email || !provider) {
        return res.status(400).json({ error: "Email and provider required" });
    }
    let user = await AdminUser.findOne({ email });
    if (!user) {
        user = await AdminUser.create({
            email,
            name,
            role: "admin",
            status: "pending",
            provider,
        });
        return res.status(403).json({ status: "pending" });
    }
    if (user.status !== "approved") {
        return res.status(403).json({ status: "pending" });
    }
    const token = signAdminToken(user);
    res.json({
        token,
        user: { id: user._id, email: user.email, role: user.role, name: user.name },
    });
});

// Google OAuth
router.get("/api/auth/google", (_req, res) => {
    const redirectUri = getOAuthRedirectUrl("google", process.env.BACKEND_URL);
    console.log("[/api/auth/google] Redirect URI:", redirectUri);
    const query = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "online",
        prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
});

router.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code;
    const adminUrl = process.env.ADMIN_URL;
    if (!code) {
        return res.redirect(resolveAdminRedirect({ error: "missing_code" }, adminUrl));
    }
    const redirectUri = getOAuthRedirectUrl("google", process.env.BACKEND_URL);
    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: String(code),
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            return res.redirect(resolveAdminRedirect({ error: "oauth_failed" }, adminUrl));
        }
        const userResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            }
        );
        const userData = await userResponse.json();
        const email = String(userData.email || "").toLowerCase();
        if (!email) {
            return res.redirect(resolveAdminRedirect({ error: "missing_email" }, adminUrl));
        }
        const user = await upsertOAuthAdmin({
            email,
            name: userData.name || "",
            provider: "google",
        });
        if (user.status !== "approved") {
            return res.redirect(resolveAdminRedirect({ status: "pending" }, adminUrl));
        }
        const token = signAdminToken(user);
        res.redirect(resolveAdminRedirect({ token }, adminUrl));
    } catch (error) {
        res.redirect(resolveAdminRedirect({ error: "oauth_error" }, adminUrl));
    }
});

// LINE OAuth
router.get("/api/auth/line", (_req, res) => {
    const redirectUri = getOAuthRedirectUrl("line", process.env.BACKEND_URL);
    const query = new URLSearchParams({
        response_type: "code",
        client_id: process.env.LINE_CLIENT_ID || "",
        redirect_uri: redirectUri,
        state: randomUUID(),
        scope: "profile openid email",
        prompt: "consent",
    });
    res.redirect(`https://access.line.me/oauth2/v2.1/authorize?${query}`);
});

router.get("/api/auth/line/callback", async (req, res) => {
    const code = req.query.code;
    const adminUrl = process.env.ADMIN_URL;
    if (!code) {
        return res.redirect(resolveAdminRedirect({ error: "missing_code" }, adminUrl));
    }
    const redirectUri = getOAuthRedirectUrl("line", process.env.BACKEND_URL);
    try {
        const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: String(code),
                redirect_uri: redirectUri,
                client_id: process.env.LINE_CLIENT_ID || "",
                client_secret: process.env.LINE_CLIENT_SECRET || "",
            }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            return res.redirect(resolveAdminRedirect({ error: "oauth_failed" }, adminUrl));
        }
        const profileResponse = await fetch("https://api.line.me/v2/profile", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileResponse.json();
        const lineId = profile.userId || profile.sub || randomUUID();
        const email = `line-${lineId}@line.local`;
        const user = await upsertOAuthAdmin({
            email,
            name: profile.displayName || "LINE User",
            provider: "line",
        });
        if (user.status !== "approved") {
            return res.redirect(resolveAdminRedirect({ status: "pending" }, adminUrl));
        }
        const token = signAdminToken(user);
        res.redirect(resolveAdminRedirect({ token }, adminUrl));
    } catch (error) {
        res.redirect(resolveAdminRedirect({ error: "oauth_error" }, adminUrl));
    }
});

// Admin Me
router.get("/admin/me", requireAdmin, async (req, res) => {
    const user = req.adminUser;
    res.json({
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
            color: user.color,
            avatar: user.avatar,
            provider: user.provider,
        },
    });
});

router.patch("/admin/me", requireAdmin, async (req, res) => {
    const patch = {
        name: req.body?.name,
        avatar: req.body?.avatar,
        color: req.body?.color,
    };
    const user = await AdminUser.findByIdAndUpdate(
        req.adminUser._id,
        { $set: patch },
        { new: true }
    ).lean();
    res.json({
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
            color: user.color,
            avatar: user.avatar,
            provider: user.provider,
        },
    });
});

// Customer Google OAuth
router.get("/auth/google", (_req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUri = `${process.env.BACKEND_URL}/auth/google/callback`;
    console.log("[/auth/google] Customer Redirect URI:", redirectUri);
    console.log("[/auth/google] Client ID:", process.env.GOOGLE_CLIENT_ID);

    const query = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "online",
        prompt: "select_account",
        state: Buffer.from(JSON.stringify({ returnUrl: frontendUrl })).toString('base64')
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
});

router.get("/auth/google/callback", async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    let returnUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    try {
        if (state) {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            returnUrl = decoded.returnUrl || returnUrl;
        }
    } catch (e) {
        console.error("Failed to decode state", e);
    }

    if (!code) {
        return res.redirect(`${returnUrl}?auth_error=missing_code`);
    }



    const redirectUri = `${process.env.BACKEND_URL}/auth/google/callback`;
    console.log("[/auth/google/callback] Verifying with Redirect URI:", redirectUri);
    console.log("[/auth/google/callback] Code:", code ? "Received" : "Missing");

    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: String(code),
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            return res.redirect(`${returnUrl}?auth_error=oauth_failed`);
        }

        const userResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            }
        );
        const userData = await userResponse.json();
        const email = String(userData.email || "").toLowerCase();
        const name = userData.name || "";

        if (!email) {
            return res.redirect(`${returnUrl}?auth_error=missing_email`);
        }

        // Store customer auth in session/cookie or return as query params
        const authData = Buffer.from(JSON.stringify({
            provider: "google",
            email,
            name,
            picture: userData.picture
        })).toString('base64');

        res.redirect(`${returnUrl}?auth_success=true&auth_data=${authData}`);
    } catch (error) {
        console.error("Google OAuth error:", error);
        res.redirect(`${returnUrl}?auth_error=oauth_error`);
    }
});

// Customer LINE OAuth
router.get("/auth/line", (_req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUri = `${process.env.BACKEND_URL}/auth/line/callback`;
    const query = new URLSearchParams({
        response_type: "code",
        client_id: process.env.LINE_CLIENT_ID || "",
        redirect_uri: redirectUri,
        state: Buffer.from(JSON.stringify({ returnUrl: frontendUrl })).toString('base64'),
        scope: "profile openid email",
        prompt: "consent",
    });
    res.redirect(`https://access.line.me/oauth2/v2.1/authorize?${query}`);
});

router.get("/auth/line/callback", async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    let returnUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    try {
        if (state) {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            returnUrl = decoded.returnUrl || returnUrl;
        }
    } catch (e) {
        console.error("Failed to decode state", e);
    }

    if (!code) {
        return res.redirect(`${returnUrl}?auth_error=missing_code`);
    }

    const redirectUri = `${process.env.BACKEND_URL}/auth/line/callback`;

    try {
        const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: String(code),
                redirect_uri: redirectUri,
                client_id: process.env.LINE_CLIENT_ID || "",
                client_secret: process.env.LINE_CLIENT_SECRET || "",
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            return res.redirect(`${returnUrl}?auth_error=oauth_failed`);
        }

        const profileResponse = await fetch("https://api.line.me/v2/profile", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileResponse.json();

        const lineUserId = profile.userId;
        const displayName = profile.displayName || "LINE User";
        const pictureUrl = profile.pictureUrl;

        // Store customer auth
        const authData = Buffer.from(JSON.stringify({
            provider: "line",
            lineUserId,
            name: displayName,
            picture: pictureUrl
        })).toString('base64');

        res.redirect(`${returnUrl}?auth_success=true&auth_data=${authData}`);
    } catch (error) {
        console.error("LINE OAuth error:", error);
        res.redirect(`${returnUrl}?auth_error=oauth_error`);
    }
});

// Customer Local Auth
router.post("/auth/customer/register", async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // Check existing
        const existing = await require("../models/Customer").findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const customer = await require("../models/Customer").create({
            email: normalizedEmail,
            passwordHash,
            provider: "local"
        });

        // Use separate signing function if possible, but for MVP we reuse similar logic or define new
        // Ideally we should import a function to sign customer tokens
        // For now, let's assume a simple payload
        const jwt = require("jsonwebtoken");
        const token = jwt.sign(
            { id: customer._id, role: "customer", email: customer.email },
            process.env.JWT_SECRET || "supersecret",
            { expiresIn: "7d" }
        );

        res.json({
            ok: true,
            token,
            user: { id: customer._id, email: customer.email, name: customer.name }
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

router.post("/auth/customer/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const customer = await require("../models/Customer").findOne({ email: normalizedEmail });

        if (!customer || !customer.passwordHash) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const jwt = require("jsonwebtoken");
        const token = jwt.sign(
            { id: customer._id, role: "customer", email: customer.email },
            process.env.JWT_SECRET || "supersecret",
            { expiresIn: "7d" }
        );

        res.json({
            ok: true,
            token,
            user: { id: customer._id, email: customer.email, name: customer.name }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// Customer Change Password
router.post("/auth/customer/change-password", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const jwt = require("jsonwebtoken");

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
        } catch (e) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { currentPassword, newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ error: "New password required" });
        }

        const Customer = require("../models/Customer");
        const customer = await Customer.findById(decoded.id);

        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // If customer has a password, verify current password
        if (customer.passwordHash) {
            if (!currentPassword) {
                return res.status(400).json({ error: "Current password required" });
            }
            const valid = await bcrypt.compare(currentPassword, customer.passwordHash);
            if (!valid) {
                return res.status(400).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
            }
        }

        // Hash and save new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        customer.passwordHash = newPasswordHash;
        await customer.save();

        res.json({ ok: true, message: "Password changed successfully" });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
});

module.exports = router;
