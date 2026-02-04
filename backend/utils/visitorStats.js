const VisitorStats = require("../models/VisitorStats");

const CACHE_KEY = "global";
const FLUSH_INTERVAL_MS = 5000;

let cache = {
  totalViews: 0,
  totalVisitors: 0,
};
let initialized = false;
let pending = { views: 0, visitors: 0 };
let flushTimer = null;
let flushing = false;

const init = async () => {
  if (initialized) return;
  const doc = await VisitorStats.findOne({ key: CACHE_KEY }).lean();
  if (doc) {
    cache.totalViews = Number(doc.totalViews || 0);
    cache.totalVisitors = Number(doc.totalVisitors || 0);
  } else {
    await VisitorStats.create({ key: CACHE_KEY });
  }
  initialized = true;
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flush();
  }, FLUSH_INTERVAL_MS);
};

const flush = async () => {
  if (flushing) return;
  if (!pending.views && !pending.visitors) return;
  flushing = true;
  const incViews = pending.views;
  const incVisitors = pending.visitors;
  pending = { views: 0, visitors: 0 };
  try {
    await VisitorStats.updateOne(
      { key: CACHE_KEY },
      {
        $inc: { totalViews: incViews, totalVisitors: incVisitors },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  } catch (error) {
    // If update fails, re-queue increments to avoid losing counts
    pending.views += incViews;
    pending.visitors += incVisitors;
    console.error("Failed to flush visitor stats", error);
  } finally {
    flushing = false;
    if (pending.views || pending.visitors) {
      scheduleFlush();
    }
  }
};

const recordVisit = async ({ newVisitor }) => {
  await init();
  cache.totalViews += 1;
  pending.views += 1;
  if (newVisitor) {
    cache.totalVisitors += 1;
    pending.visitors += 1;
  }
  scheduleFlush();
  return { ...cache };
};

const getStats = async () => {
  await init();
  return { ...cache };
};

module.exports = {
  recordVisit,
  getStats,
};
