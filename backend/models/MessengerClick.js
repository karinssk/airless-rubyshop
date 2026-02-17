const mongoose = require("mongoose");

const messengerClickSchema = new mongoose.Schema(
  {
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    referrer: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessengerClick", messengerClickSchema);
