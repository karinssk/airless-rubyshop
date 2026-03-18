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

const supportedSourceFilters = new Set([
  "all",
  "messenger",
  "hero",
  "promotion",
  "other",
]);

const supportedEventTypes = new Set(["click", "session-end"]);

const normalizeDeviceFilter = (value) => {
  const normalized = String(value || "all").trim().toLowerCase();
  return supportedDeviceFilters.has(normalized) ? normalized : "all";
};

const normalizeDateRangeFilter = (value) => {
  const normalized = String(value || "all").trim().toLowerCase();
  return supportedDateRangeFilters.has(normalized) ? normalized : "all";
};

const normalizeSourceFilter = (value) => {
  const normalized = String(value || "all").trim().toLowerCase();
  return supportedSourceFilters.has(normalized) ? normalized : "all";
};

const normalizeEventType = (value) => {
  const normalized = String(value || "click").trim().toLowerCase();
  return supportedEventTypes.has(normalized) ? normalized : "click";
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

const parseDateTimeInput = (value) => {
  if (!value) return null;
  const date = new Date(String(value).trim());
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

const normalizeSourceValue = (value) =>
  truncateString(value, 120).trim().toLowerCase();

const getSourceBucket = (source) => {
  const normalized = normalizeSourceValue(source);
  if (!normalized || normalized.startsWith("messenger")) return "messenger";
  if (normalized.startsWith("hero-with-2-cta-btn")) return "hero";
  if (normalized.startsWith("promotion-countdown")) return "promotion";
  return "other";
};

const getSourceQuery = (sourceFilter) => {
  switch (sourceFilter) {
    case "messenger":
      return {
        $or: [
          { source: { $exists: false } },
          { source: "" },
          { source: /^messenger/i },
        ],
      };
    case "hero":
      return { source: /^hero-with-2-cta-btn/i };
    case "promotion":
      return { source: /^promotion-countdown/i };
    case "other":
      return {
        $and: [
          { source: { $exists: true, $ne: "" } },
          { source: { $not: /^messenger/i } },
          { source: { $not: /^hero-with-2-cta-btn/i } },
          { source: { $not: /^promotion-countdown/i } },
        ],
      };
    default:
      return {};
  }
};

const combineQueries = (...queries) => {
  const validQueries = queries.filter(
    (query) => query && Object.keys(query).length > 0
  );
  if (validQueries.length === 0) return {};
  if (validQueries.length === 1) return validQueries[0];
  return { $and: validQueries };
};

const clickEventsOnlyQuery = {
  $or: [
    { eventType: { $exists: false } },
    { eventType: "click" },
  ],
};

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

const assessBotSignals = ({ userAgent, jsSignals, durationMs, eventType }) => {
  const ua = String(userAgent || "").toLowerCase();
  const normalizedEventType = normalizeEventType(eventType);
  const safeDurationMs = Math.max(0, Math.floor(toSafeNumber(durationMs, 0)));
  const hasDuration = safeDurationMs > 0;
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
  if (hasDuration && safeDurationMs < 500) {
    score += 20;
    reasons.push("Interaction happened extremely fast (<0.5s)");
  } else if (hasDuration && safeDurationMs < 1500) {
    score += 12;
    reasons.push("Interaction happened very quickly (<1.5s)");
  } else if (hasDuration && safeDurationMs < 4000) {
    score += 6;
    reasons.push("Interaction happened quickly (<4s)");
  }
  if (normalizedEventType === "session-end" && hasDuration && safeDurationMs < 1000) {
    score += 12;
    reasons.push("Session ended almost immediately");
  }
  if (hasDuration && safeDurationMs >= 120000) {
    score -= 5;
    reasons.push("Long dwell time before action (human-like)");
  }

  score = Math.max(0, Math.min(100, score));
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
    const eventType = normalizeEventType(req.body?.eventType);
    const source = normalizeSourceValue(req.body?.source) ||
      (eventType === "session-end" ? "session-exit" : "messenger-floating-button");
    const label = truncateString(req.body?.label, 120);
    const targetHref = truncateString(req.body?.targetHref, 1000);
    const visitorId = truncateString(req.body?.visitorId, 120);
    const sessionId = truncateString(req.body?.sessionId, 120);
    const durationMs = Math.max(0, Math.floor(toSafeNumber(req.body?.durationMs)));
    const sessionStartedAt = parseDateTimeInput(req.body?.sessionStartedAt);
    const sessionEndedAt = parseDateTimeInput(req.body?.sessionEndedAt);
    const endReason = truncateString(req.body?.endReason, 120);
    const jsSignals = sanitizeJsSignals(req.body?.jsSignals);
    const botAssessment = assessBotSignals({
      userAgent,
      jsSignals,
      durationMs,
      eventType,
    });
    await MessengerClick.create({
      eventType,
      source,
      label,
      targetHref,
      visitorId,
      sessionId,
      durationMs,
      sessionStartedAt,
      sessionEndedAt,
      endReason,
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
    const selectedSource = normalizeSourceFilter(req.query?.source);
    const customStartDate = String(req.query?.startDate || "").trim();
    const customEndDate = String(req.query?.endDate || "").trim();
    const skip = (page - 1) * limit;
    const dateRangeQuery = buildDateRangeQuery(
      selectedDateRange,
      customStartDate,
      customEndDate
    );
    const deviceQuery = getDeviceQuery(selectedDevice);
    const sourceQuery = getSourceQuery(selectedSource);
    const logsFilterQuery = combineQueries(
      clickEventsOnlyQuery,
      dateRangeQuery,
      deviceQuery,
      sourceQuery
    );
    const dateFilteredQuery = combineQueries(clickEventsOnlyQuery, dateRangeQuery);

    const totalClicks = await MessengerClick.countDocuments(clickEventsOnlyQuery);
    const filteredTotalClicks = await MessengerClick.countDocuments(logsFilterQuery);
    const dateFilteredTotalClicks = await MessengerClick.countDocuments(dateFilteredQuery);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayClicks = await MessengerClick.countDocuments(
      combineQueries(clickEventsOnlyQuery, {
        createdAt: { $gte: todayStart },
      })
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Days = await MessengerClick.aggregate([
      {
        $match: combineQueries(clickEventsOnlyQuery, {
          createdAt: { $gte: thirtyDaysAgo },
        }),
      },
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
      source: normalizeSourceValue(log.source) || "messenger-legacy",
      sourceBucket: getSourceBucket(log.source),
      eventType: truncateString(log.eventType, 40) || "click",
      label: truncateString(log.label, 120),
      targetHref: truncateString(log.targetHref, 1000),
      visitorId: truncateString(log.visitorId, 120),
      sessionId: truncateString(log.sessionId, 120),
      endReason: truncateString(log.endReason, 120),
      durationMs: Math.max(0, Math.floor(toSafeNumber(log.durationMs))),
      sessionStartedAt: log.sessionStartedAt
        ? new Date(log.sessionStartedAt).toISOString()
        : null,
      sessionEndedAt: log.sessionEndedAt
        ? new Date(log.sessionEndedAt).toISOString()
        : null,
    }));

    const deviceAggregation = await MessengerClick.aggregate([
      {
        $match: combineQueries(clickEventsOnlyQuery, dateRangeQuery),
      },
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

    const sourceProjectStage = {
      $project: {
        sourceBucket: {
          $switch: {
            branches: [
              {
                case: {
                  $or: [
                    { $eq: [{ $ifNull: ["$source", ""] }, ""] },
                    {
                      $regexMatch: {
                        input: { $ifNull: ["$source", ""] },
                        regex: /^messenger/i,
                      },
                    },
                  ],
                },
                then: "messenger",
              },
              {
                case: {
                  $regexMatch: {
                    input: { $ifNull: ["$source", ""] },
                    regex: /^hero-with-2-cta-btn/i,
                  },
                },
                then: "hero",
              },
              {
                case: {
                  $regexMatch: {
                    input: { $ifNull: ["$source", ""] },
                    regex: /^promotion-countdown/i,
                  },
                },
                then: "promotion",
              },
            ],
            default: "other",
          },
        },
      },
    };

    const sourceAggregation = await MessengerClick.aggregate([
      {
        $match: combineQueries(clickEventsOnlyQuery, dateRangeQuery),
      },
      sourceProjectStage,
      { $group: { _id: "$sourceBucket", count: { $sum: 1 } } },
    ]);

    const sourceBreakdown = {
      all: dateFilteredTotalClicks,
      messenger: 0,
      hero: 0,
      promotion: 0,
      other: 0,
    };

    sourceAggregation.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(sourceBreakdown, item._id)) {
        sourceBreakdown[item._id] = Number(item.count || 0);
      }
    });

    const todaySourceAggregation = await MessengerClick.aggregate([
      {
        $match: combineQueries(clickEventsOnlyQuery, {
          createdAt: { $gte: todayStart },
        }),
      },
      sourceProjectStage,
      { $group: { _id: "$sourceBucket", count: { $sum: 1 } } },
    ]);

    const todaySourceBreakdown = {
      all: todayClicks,
      messenger: 0,
      hero: 0,
      promotion: 0,
      other: 0,
    };

    todaySourceAggregation.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(todaySourceBreakdown, item._id)) {
        todaySourceBreakdown[item._id] = Number(item.count || 0);
      }
    });

    const botAggregation = await MessengerClick.aggregate([
      ...(Object.keys(logsFilterQuery).length > 0
        ? [{ $match: logsFilterQuery }]
        : []),
      {
        $project: {
          bucket: {
            $cond: [{ $eq: ["$botAssessment.suspected", true] }, "suspected", "human"],
          },
        },
      },
      { $group: { _id: "$bucket", count: { $sum: 1 } } },
    ]);

    const botBreakdown = {
      suspected: 0,
      human: 0,
    };

    botAggregation.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(botBreakdown, item._id)) {
        botBreakdown[item._id] = Number(item.count || 0);
      }
    });

    const botLevelAggregation = await MessengerClick.aggregate([
      ...(Object.keys(logsFilterQuery).length > 0
        ? [{ $match: logsFilterQuery }]
        : []),
      {
        $project: {
          level: {
            $switch: {
              branches: [
                { case: { $eq: ["$botAssessment.level", "high"] }, then: "high" },
                { case: { $eq: ["$botAssessment.level", "medium"] }, then: "medium" },
              ],
              default: "low",
            },
          },
        },
      },
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]);

    const botLevelBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
    };

    botLevelAggregation.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(botLevelBreakdown, item._id)) {
        botLevelBreakdown[item._id] = Number(item.count || 0);
      }
    });

    const weekdayAggregation = await MessengerClick.aggregate([
      ...(Object.keys(logsFilterQuery).length > 0
        ? [{ $match: logsFilterQuery }]
        : []),
      {
        $group: {
          _id: { $subtract: [{ $dayOfWeek: "$createdAt" }, 1] },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdayBreakdown = weekdayLabels.map((label, dayIndex) => ({
      dayIndex,
      label,
      count: 0,
    }));

    weekdayAggregation.forEach((item) => {
      const dayIndex = Number(item._id);
      if (Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex <= 6) {
        weekdayBreakdown[dayIndex].count = Number(item.count || 0);
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
      selectedSource,
      customStartDate,
      customEndDate,
      dailyBreakdown,
      hourlyBreakdown,
      deviceBreakdown,
      sourceBreakdown,
      todaySourceBreakdown,
      botBreakdown,
      botLevelBreakdown,
      weekdayBreakdown,
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
