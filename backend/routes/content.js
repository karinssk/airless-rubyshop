const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const Menu = require("../models/Menu");
const AdminMenu = require("../models/AdminMenu");
const Footer = require("../models/Footer");
const QuickLinks = require("../models/QuickLinks");

// Helper function to extract language-specific string
function getLangString(value, locale) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.th || value.en || "";
}

// Helper function to extract language-specific menu items recursively
function extractLocaleMenu(items, locale) {
    return items.map(item => ({
        ...item,
        label: getLangString(item.label, locale),
        children: item.children ? extractLocaleMenu(item.children, locale) : undefined
    }));
}

// Menu
router.get("/menu", async (req, res) => {
    const locale = req.query.locale; // frontend: ?locale=th or ?locale=en
    const isAdmin = req.query.admin === "1"; // admin: ?admin=1

    let menu = await Menu.findOne({ name: "main" }).lean();
    if (!menu) {
        menu = {
            name: "main",
            logoUrl: "",
            items: [
                { id: randomUUID(), label: "Home", href: "/" },
                {
                    id: randomUUID(),
                    label: "All Services",
                    href: "/services",
                    children: [
                        { id: randomUUID(), label: "Air Conditioning Cleaning", href: "/services/cleaning" },
                        { id: randomUUID(), label: "Air Conditioning Installation", href: "/services/installation" },
                        { id: randomUUID(), label: "Air Conditioning Repair", href: "/services/repair" },
                        { id: randomUUID(), label: "AMC", href: "/services/amc" },
                    ],
                },
                { id: randomUUID(), label: "Products", href: "/products" },
                { id: randomUUID(), label: "Contact Us", href: "/contact" },
                { id: randomUUID(), label: "About", href: "/about" },
                { id: randomUUID(), label: "Articles", href: "/articles" },
            ],
        };
        await Menu.create(menu);
    }

    // If admin mode, return full multi-language data
    if (isAdmin) {
        return res.json({ menu });
    }

    // Otherwise, return locale-specific data for frontend
    const targetLocale = locale || "th";
    const localizedMenu = {
        ...menu,
        items: extractLocaleMenu(menu.items, targetLocale),
        cta: menu.cta ? {
            label: getLangString(menu.cta.label, targetLocale),
            href: menu.cta.href
        } : undefined,
        contactBar: menu.contactBar ? {
            ...menu.contactBar,
            items: menu.contactBar.items.map(item => ({
                ...item,
                text: getLangString(item.text, targetLocale)
            }))
        } : undefined
    };

    res.json({ menu: localizedMenu });
});

router.put("/menu", async (req, res) => {
    const items = req.body?.items || [];
    const cta = req.body?.cta || undefined;
    const logoUrl = req.body?.logoUrl;
    const contactBar = req.body?.contactBar || undefined;
    const menu = await Menu.findOneAndUpdate(
        { name: "main" },
        { $set: { items, ...(cta ? { cta } : {}), ...(logoUrl !== undefined ? { logoUrl } : {}), ...(contactBar !== undefined ? { contactBar } : {}) } },
        { new: true, upsert: true }
    ).lean();
    res.json({ menu });
});

// Admin Menu
router.get("/admin-menu", async (_req, res) => {
    let menu = await AdminMenu.findOne({ name: "main" }).lean();
    if (!menu) {
        menu = {
            name: "main",
            items: [
                { id: randomUUID(), label: "Overview", href: "/", permission: "everyone" },
                { id: randomUUID(), label: "Pages", href: "/pages", permission: "everyone" },
                { id: randomUUID(), label: "Blog", href: "/blog", permission: "everyone" },
                { id: randomUUID(), label: "Services", href: "/services", permission: "everyone" },
                { id: randomUUID(), label: "Products", href: "/products", permission: "everyone" },
                {
                    id: randomUUID(),
                    label: "Settings",
                    href: "",
                    children: [
                        { id: randomUUID(), label: "Navbar", href: "/menu", permission: "everyone" },
                        { id: randomUUID(), label: "Footer", href: "/footer", permission: "everyone" },
                        { id: randomUUID(), label: "Quick Links", href: "/quick-links", permission: "everyone" },
                        { id: randomUUID(), label: "Payment Setting", href: "/payment-setting", permission: "everyone" },
                        { id: randomUUID(), label: "Email Templates", href: "/email-templates", permission: "everyone" },
                        { id: randomUUID(), label: "Admin Menu", href: "/admin-menu", permission: "owner-only" },
                        { id: randomUUID(), label: "Profile", href: "/profile", permission: "everyone" },
                        { id: randomUUID(), label: "Admin Approvals", href: "/admin-users", permission: "owner-only" },
                    ],
                },
                { id: randomUUID(), label: "Forms Submitted", href: "/forms-submitted", permission: "everyone" },
                { id: randomUUID(), label: "Media", href: "/media", permission: "everyone" },
                { id: randomUUID(), label: "Chat", href: "/chat", permission: "everyone" },
            ],
        };
        await AdminMenu.create(menu);
    }
    res.json({ menu });
});

router.put("/admin-menu", async (req, res) => {
    const items = req.body?.items || [];
    const menu = await AdminMenu.findOneAndUpdate(
        { name: "main" },
        { $set: { items } },
        { new: true, upsert: true }
    ).lean();
    res.json({ menu });
});

// Footer
router.get("/footer", async (_req, res) => {
    let footer = await Footer.findOne({ name: "main" }).lean();
    if (!footer) {
        const backendUrl = process.env.BACKEND_URL;
        footer = {
            name: "main",
            backgroundColor: "#0b3c86",
            brand: {
                name: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
                description:
                    "หจก.รูบี้ช๊อปเราคือผู้นำเข้าจัดหาเครื่องมือสำหรับช่างมืออาชีพเช่น - เครื่องพ่นสีแรงดันสูง - เครื่องพ่นสีกันไฟ - เครื่องพ่นปูนฉาบ - เครื่องตีเส้นถนน - เครื่องกรีดผนัง - เครื่องเลเซอร์ระดับ - เครื่องผสมสี - เครื่องปั่นหน้าปูนและอื่นๆอีกมากมายจากต่างประเทศและสั่งผลิตสินค้าและจัดจำหน่ายทั้งปลึกและส่งลูกค้าจึงเชื่อมันกับเราได้ว่าเราสามารถจัดหาอะไหล่หรือให้คำแนะนำได้สำหรับเครื่องจักรทุกชนิดมีเครื่องให้ท่านทดลองใช้งานกับวัสดุสีของท่านก่อนซื้อ",
                logoUrl: `${backendUrl}/uploads/logo/rubyshop-no-bg-250pxx100px.jpg`,
            },
            social: [
                {
                    id: randomUUID(),
                    label: "Facebook",
                    href: "https://facebook.com",
                    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg",
                },
                {
                    id: randomUUID(),
                    label: "Line",
                    href: "https://line.me",
                    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/line.svg",
                },
                {
                    id: randomUUID(),
                    label: "TikTok",
                    href: "https://tiktok.com",
                    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/tiktok.svg",
                },
                {
                    id: randomUUID(),
                    label: "Instagram",
                    href: "https://instagram.com",
                    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg",
                },
                {
                    id: randomUUID(),
                    label: "YouTube",
                    href: "https://youtube.com",
                    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg",
                },
            ],
            services: [
                { id: randomUUID(), label: "ล้างแอร์สำนักงาน", href: "/services/cleaning" },
                { id: randomUUID(), label: "ติดตั้งระบบแอร์", href: "/services/installation" },
                { id: randomUUID(), label: "ซ่อมและตรวจเช็ค", href: "/services/repair" },
                { id: randomUUID(), label: "สัญญาบำรุงรักษารายปี", href: "/services/amc" },
            ],
            menu: [
                { id: randomUUID(), label: "หน้าแรก", href: "/" },
                { id: randomUUID(), label: "บริการ", href: "/services" },
                { id: randomUUID(), label: "เกี่ยวกับเรา", href: "/about" },
                { id: randomUUID(), label: "ลูกค้าของเรา", href: "/portfolio" },
                { id: randomUUID(), label: "ติดต่อเรา", href: "/contact" },
            ],
            contact: [
                {
                    id: randomUUID(),
                    label: "TH: 092-293-4488",
                    value: "EN: 092-293-8191",
                    href: "",
                    icon: "https://cdn.jsdelivr.net/npm/heroicons@2.1.5/24/outline/phone.svg",
                },
                {
                    id: randomUUID(),
                    label: "บริการ 24 ชั่วโมง",
                    value: "",
                    href: "",
                    icon: "https://cdn.jsdelivr.net/npm/heroicons@2.1.5/24/outline/clock.svg",
                },
                {
                    id: randomUUID(),
                    label: "info@rubyshop.com",
                    value: "",
                    href: "mailto:info@rubyshop.com",
                    icon: "https://cdn.jsdelivr.net/npm/heroicons@2.1.5/24/outline/envelope.svg",
                },
                {
                    id: randomUUID(),
                    label: "บริการทั่วประเทศ",
                    value: "",
                    href: "",
                    icon: "https://cdn.jsdelivr.net/npm/heroicons@2.1.5/24/outline/map-pin.svg",
                },
            ],
            copyright:
                "© 2026 RUBYSHOP. All rights reserved.",
            subfooter: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
        };
        await Footer.create(footer);
    }
    res.json({ footer });
});

router.put("/footer", async (req, res) => {
    const data = req.body || {};
    const footer = await Footer.findOneAndUpdate(
        { name: "main" },
        { $set: { ...data, name: "main" } },
        { new: true, upsert: true }
    ).lean();
    res.json({ footer });
});

// Quick Links
router.get("/quick-links", async (_req, res) => {
    let links = await QuickLinks.findOne({ name: "main" }).lean();
    if (!links) {
        links = {
            name: "main",
            whatsapp: {
                enabled: true,
                href: "https://wa.me/66922934488",
            },
            line: {
                enabled: true,
                href: "https://line.me",
            },
            phone: {
                enabled: true,
                href: "tel:092-293-4488",
                label: "092-293-4488",
            },
        };
        await QuickLinks.create(links);
    }
    res.json({ links });
});

router.put("/quick-links", async (req, res) => {
    const payload = {
        name: "main",
        whatsapp: req.body?.whatsapp || {},
        line: req.body?.line || {},
        phone: req.body?.phone || {},
    };
    const links = await QuickLinks.findOneAndUpdate(
        { name: "main" },
        { $set: payload },
        { new: true, upsert: true }
    ).lean();
    res.json({ links });
});

module.exports = router;
