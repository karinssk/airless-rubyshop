const express = require("express");
const router = express.Router();
const { recordVisit, getStats } = require("../utils/visitorStats");

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

module.exports = router;
