const express = require("express");
const router = express.Router();
const { recordVisit, getStats } = require("../utils/visitorStats");
const MessengerClick = require("../models/MessengerClick");
const { requireAdmin } = require("../utils/auth");

const supportedDeviceFilters = new Set([
  "all",
  "iphone",
  "android",
  "pc",
  "linux",
  "mac",
]);

const supportedDateRangeFilters = new Set([
  "all",
  "today",
  "7d",
  "30d",
  "custom",
]);

const normalizeDeviceFilter = (value) => {
  const normalized = String(value || "all").trim().toLowerCase();
  return supportedDeviceFilters.has(normalized) ? normalized : "all";
};

const normalizeDateRangeFilter = (value) => {
  const normalized = String(value || "all").trim().toLowerCase();
  return supportedDateRangeFilters.has(normalized) ? normalized : "all";
};

const parseDateInput = (value) => {
  if (!value) return null;
  const input = String(value).trim();
  const matched = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matched) {
    const year = Number(matched[1]);
    const monthIndex = Number(matched[2]) - 1;
    const day = Number(matched[3]);
    const localDate = new Date(year, monthIndex, day);
    if (!Number.isNaN(localDate.getTime())) return localDate;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const buildDateRangeQuery = (range, customStartDate, customEndDate) => {
  const now = new Date();

  if (range === "today") {
    return {
      createdAt: {
        $gte: startOfDay(now),
        $lte: endOfDay(now),
      },
    };
  }

  if (range === "7d") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 6);
    return {
      createdAt: {
        $gte: start,
        $lte: endOfDay(now),
      },
    };
  }

  if (range === "30d") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 29);
    return {
      createdAt: {
        $gte: start,
        $lte: endOfDay(now),
      },
    };
  }

  if (range === "custom") {
    const dateQuery = {};
    let parsedStart = parseDateInput(customStartDate);
    let parsedEnd = parseDateInput(customEndDate);
    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      const temp = parsedStart;
      parsedStart = parsedEnd;
      parsedEnd = temp;
    }
    if (parsedStart) dateQuery.$gte = startOfDay(parsedStart);
    if (parsedEnd) dateQuery.$lte = endOfDay(parsedEnd);
    if (Object.keys(dateQuery).length > 0) return { createdAt: dateQuery };
  }

  return {};
};

const getDeviceQuery = (device) => {
  switch (device) {
    case "iphone":
      return { userAgent: /iphone/i };
    case "android":
      return { userAgent: /android/i };
    case "pc":
      return { userAgent: /windows nt/i };
    case "linux":
      return { $and: [{ userAgent: /linux/i }, { userAgent: { $not: /android/i } }] };
    case "mac":
      return { userAgent: /macintosh/i };
    default:
      return {};
  }
};

const detectDeviceFromUserAgent = (userAgent) => {
  const ua = String(userAgent || "").toLowerCase();
  if (ua.includes("iphone")) return "iphone";
  if (ua.includes("android")) return "android";
  if (ua.includes("windows nt")) return "pc";
  if (ua.includes("macintosh")) return "mac";
  if (ua.includes("linux")) return "linux";
  return "other";
};

const truncateString = (value, maxLength = 200) =>
  String(value || "").slice(0, maxLength);

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeJsSignals = (signals) => {
  const payload = signals && typeof signals === "object" ? signals : {};
  const languages = Array.isArray(payload.languages)
    ? payload.languages
      .slice(0, 10)
      .map((item) => truncateString(item, 20))
      .filter(Boolean)
    : [];

  return {
    webdriver: Boolean(payload.webdriver),
    platform: truncateString(payload.platform, 80),
    language: truncateString(payload.language, 20),
    languages,
    pluginsLength: Math.max(0, Math.floor(toSafeNumber(payload.pluginsLength))),
    mimeTypesLength: Math.max(0, Math.floor(toSafeNumber(payload.mimeTypesLength))),
    hardwareConcurrency: Math.max(
      0,
      Math.floor(toSafeNumber(payload.hardwareConcurrency))
    ),
    deviceMemory: Math.max(0, toSafeNumber(payload.deviceMemory)),
    maxTouchPoints: Math.max(0, Math.floor(toSafeNumber(payload.maxTouchPoints))),
    screenWidth: Math.max(0, Math.floor(toSafeNumber(payload.screenWidth))),
    screenHeight: Math.max(0, Math.floor(toSafeNumber(payload.screenHeight))),
    viewportWidth: Math.max(0, Math.floor(toSafeNumber(payload.viewportWidth))),
    viewportHeight: Math.max(0, Math.floor(toSafeNumber(payload.viewportHeight))),
    pixelRatio: Math.max(0, toSafeNumber(payload.pixelRatio)),
    timezone: truncateString(payload.timezone, 100),
    timezoneOffset: Math.floor(toSafeNumber(payload.timezoneOffset)),
    hasChromeObject: Boolean(payload.hasChromeObject),
    hasPlaywright: Boolean(payload.hasPlaywright),
    hasPuppeteer: Boolean(payload.hasPuppeteer),
    hasSelenium: Boolean(payload.hasSelenium),
    hasPhantom: Boolean(payload.hasPhantom),
    doNotTrack: truncateString(payload.doNotTrack, 30),
    cookieEnabled: Boolean(payload.cookieEnabled),
    touchSupport: Boolean(payload.touchSupport),
    colorDepth: Math.max(0, Math.floor(toSafeNumber(payload.colorDepth))),
  };
};

const assessBotSignals = ({ userAgent, jsSignals }) => {
  const ua = String(userAgent || "").toLowerCase();
  const reasons = [];
  let score = 0;

  if (/headless|phantomjs|selenium|puppeteer|playwright/.test(ua)) {
    score += 80;
    reasons.push("User-Agent contains known automation keyword");
  }
  if (jsSignals.webdriver) {
    score += 70;
    reasons.push("navigator.webdriver is true");
  }
  if (jsSignals.hasPlaywright) {
    score += 60;
    reasons.push("Playwright marker detected");
  }
  if (jsSignals.hasPuppeteer) {
    score += 60;
    reasons.push("Puppeteer marker detected");
  }
  if (jsSignals.hasSelenium) {
    score += 60;
    reasons.push("Selenium marker detected");
  }
  if (jsSignals.hasPhantom) {
    score += 60;
    reasons.push("PhantomJS marker detected");
  }
  if (jsSignals.languages.length === 0) {
    score += 10;
    reasons.push("No navigator languages");
  }
  if (jsSignals.pluginsLength === 0 && !/iphone|android/.test(ua)) {
    score += 10;
    reasons.push("No navigator plugins on desktop-like UA");
  }
  if (jsSignals.timezone === "") {
    score += 5;
    reasons.push("Missing timezone");
  }
  if (jsSignals.screenWidth <= 0 || jsSignals.screenHeight <= 0) {
    score += 10;
    reasons.push("Invalid screen dimensions");
  }

  score = Math.min(100, score);
  const suspected = score >= 50;
  const level = score >= 80 ? "high" : score >= 50 ? "medium" : "low";

  return { score, suspected, level, reasons: reasons.slice(0, 10) };
};

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
    const jsSignals = sanitizeJsSignals(req.body?.jsSignals);
    const botAssessment = assessBotSignals({ userAgent, jsSignals });
    await MessengerClick.create({
      ip,
      userAgent,
      referrer,
      jsSignals,
      botAssessment,
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to record messenger click", error);
    res.status(500).json({ ok: false, error: "Failed to record click" });
  }
});

router.get("/stats/messenger-clicks", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(req.query?.limit) || 50));
    const selectedDevice = normalizeDeviceFilter(req.query?.device);
    const selectedDateRange = normalizeDateRangeFilter(req.query?.dateRange);
    const customStartDate = String(req.query?.startDate || "").trim();
    const customEndDate = String(req.query?.endDate || "").trim();
    const skip = (page - 1) * limit;
    const dateRangeQuery = buildDateRangeQuery(
      selectedDateRange,
      customStartDate,
      customEndDate
    );
    const deviceQuery = getDeviceQuery(selectedDevice);
    const filterParts = [dateRangeQuery, deviceQuery].filter(
      (query) => Object.keys(query).length > 0
    );
    const logsFilterQuery =
      filterParts.length === 0
        ? {}
        : filterParts.length === 1
          ? filterParts[0]
          : { $and: filterParts };

    const totalClicks = await MessengerClick.countDocuments();
    const filteredTotalClicks = await MessengerClick.countDocuments(logsFilterQuery);
    const dateFilteredTotalClicks = await MessengerClick.countDocuments(
      dateRangeQuery
    );

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

    const dailyBreakdown = await MessengerClick.aggregate([
      ...(Object.keys(logsFilterQuery).length > 0
        ? [{ $match: logsFilterQuery }]
        : []),
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]);

    const hourlyAggregation = await MessengerClick.aggregate([
      ...(Object.keys(logsFilterQuery).length > 0
        ? [{ $match: logsFilterQuery }]
        : []),
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: "$_id", count: 1 } },
    ]);

    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
    }));

    hourlyAggregation.forEach((entry) => {
      const hour = Number(entry.hour);
      if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
        hourlyBreakdown[hour].count = Number(entry.count || 0);
      }
    });

    const clickLogsRaw = await MessengerClick.find(logsFilterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const clickLogs = clickLogsRaw.map((log) => ({
      ...log,
      device: detectDeviceFromUserAgent(log.userAgent),
    }));

    const deviceAggregation = await MessengerClick.aggregate([
      ...(Object.keys(dateRangeQuery).length > 0
        ? [{ $match: dateRangeQuery }]
        : []),
      {
        $project: {
          _id: 0,
          device: {
            $switch: {
              branches: [
                {
                  case: {
                    $regexMatch: {
                      input: { $ifNull: ["$userAgent", ""] },
                      regex: /iphone/i,
                    },
                  },
                  then: "iphone",
                },
                {
                  case: {
                    $regexMatch: {
                      input: { $ifNull: ["$userAgent", ""] },
                      regex: /android/i,
                    },
                  },
                  then: "android",
                },
                {
                  case: {
                    $regexMatch: {
                      input: { $ifNull: ["$userAgent", ""] },
                      regex: /windows nt/i,
                    },
                  },
                  then: "pc",
                },
                {
                  case: {
                    $regexMatch: {
                      input: { $ifNull: ["$userAgent", ""] },
                      regex: /macintosh/i,
                    },
                  },
                  then: "mac",
                },
                {
                  case: {
                    $regexMatch: {
                      input: { $ifNull: ["$userAgent", ""] },
                      regex: /linux/i,
                    },
                  },
                  then: "linux",
                },
              ],
              default: "other",
            },
          },
        },
      },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]);

    const deviceBreakdown = {
      all: dateFilteredTotalClicks,
      iphone: 0,
      android: 0,
      pc: 0,
      linux: 0,
      mac: 0,
      other: 0,
    };

    deviceAggregation.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(deviceBreakdown, item._id)) {
        deviceBreakdown[item._id] = Number(item.count || 0);
      }
    });

    const totalPages = Math.max(1, Math.ceil(filteredTotalClicks / limit));

    res.json({
      ok: true,
      totalClicks,
      filteredTotalClicks,
      dateFilteredTotalClicks,
      todayClicks,
      last30Days,
      selectedDevice,
      selectedDateRange,
      customStartDate,
      customEndDate,
      dailyBreakdown,
      hourlyBreakdown,
      deviceBreakdown,
      clickLogs,
      recentClicks: clickLogs,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Failed to fetch messenger click stats", error);
    res.status(500).json({ ok: false, error: "Failed to fetch stats" });
  }
});

module.exports = router;
