const express = require("express");
const router = express.Router();
const { recordVisit, getStats } = require("../utils/visitorStats");
const MessengerClick = require("../models/MessengerClick");
const { requireAdmin } = require("../utils/auth");

router.post("/stats/visit", async (req, res) => {
  try {
    const newVisitor = Boolean(req.body?.newVisitor);
    const stats = await recordVisit({ newVisitor });
    res.json({ ok: true, stats });
  } catch (error) {
    console.error("Failed to record visit", error);
    res.status(500).json({ ok: false, error: "Failed to record visit" });
  }
});

router.get("/stats/visit", async (_req, res) => {
  try {
    const stats = await getStats();
    res.json({ ok: true, stats });
  } catch (error) {
    console.error("Failed to fetch visit stats", error);
    res.status(500).json({ ok: false, error: "Failed to fetch stats" });
  }
});

// --- Messenger click tracking ---

router.post("/stats/messenger-click", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.body?.referrer || "";
    await MessengerClick.create({ ip, userAgent, referrer });
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to record messenger click", error);
    res.status(500).json({ ok: false, error: "Failed to record click" });
  }
});

router.get("/stats/messenger-clicks", requireAdmin, async (_req, res) => {
  try {
    const totalClicks = await MessengerClick.countDocuments();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayClicks = await MessengerClick.countDocuments({
      createdAt: { $gte: todayStart },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Days = await MessengerClick.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]);

    const recentClicks = await MessengerClick.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ ok: true, totalClicks, todayClicks, last30Days, recentClicks });
  } catch (error) {
    console.error("Failed to fetch messenger click stats", error);
    res.status(500).json({ ok: false, error: "Failed to fetch stats" });
  }
});

module.exports = router;
