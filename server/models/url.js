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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: {
        expireAfterSeconds: 0, // TTL index for automatic expiration cleanup
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Url", urlSchema);
