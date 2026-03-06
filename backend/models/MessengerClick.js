const mongoose = require("mongoose");

const jsSignalsSchema = new mongoose.Schema(
  {
    webdriver: { type: Boolean, default: false },
    platform: { type: String, default: "" },
    language: { type: String, default: "" },
    languages: { type: [String], default: [] },
    pluginsLength: { type: Number, default: 0 },
    mimeTypesLength: { type: Number, default: 0 },
    hardwareConcurrency: { type: Number, default: 0 },
    deviceMemory: { type: Number, default: 0 },
    maxTouchPoints: { type: Number, default: 0 },
    screenWidth: { type: Number, default: 0 },
    screenHeight: { type: Number, default: 0 },
    viewportWidth: { type: Number, default: 0 },
    viewportHeight: { type: Number, default: 0 },
    pixelRatio: { type: Number, default: 0 },
    timezone: { type: String, default: "" },
    timezoneOffset: { type: Number, default: 0 },
    hasChromeObject: { type: Boolean, default: false },
    hasPlaywright: { type: Boolean, default: false },
    hasPuppeteer: { type: Boolean, default: false },
    hasSelenium: { type: Boolean, default: false },
    hasPhantom: { type: Boolean, default: false },
    doNotTrack: { type: String, default: "" },
    cookieEnabled: { type: Boolean, default: true },
    touchSupport: { type: Boolean, default: false },
    colorDepth: { type: Number, default: 0 },
  },
  { _id: false }
);

const botAssessmentSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    suspected: { type: Boolean, default: false },
    level: { type: String, default: "low" },
    reasons: { type: [String], default: [] },
  },
  { _id: false }
);

const messengerClickSchema = new mongoose.Schema(
  {
    source: { type: String, default: "messenger-floating-button" },
    label: { type: String, default: "" },
    targetHref: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    referrer: { type: String, default: "" },
    jsSignals: { type: jsSignalsSchema, default: () => ({}) },
    botAssessment: { type: botAssessmentSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessengerClick", messengerClickSchema);
