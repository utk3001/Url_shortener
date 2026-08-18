const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    long: {
      type: String,
      required: true,
    },
    short: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: {
        expireAfterSeconds: 0, // TTL index
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Url", urlSchema);
