const mongoose = require("mongoose");

const visitorStatsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    totalViews: { type: Number, default: 0 },
    totalVisitors: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VisitorStats", visitorStatsSchema);
