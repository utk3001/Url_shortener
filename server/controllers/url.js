const Url = require("../models/url");
const { redisClient } = require("../cache/redis");
const Counter = require("../models/counter");
const { encodeBase62 } = require("../utility/base62");

const CACHE_TTL = 60 * 60; // 1 hour

// POST /shorten
const short = async (req, res) => {
  try {
    const { long, expiresIn, ttl } = req.body;
    const expirySeconds = expiresIn || ttl;
    const userId = req.user?.id || null;

    // If long URL already shortened by this user (or globally if guest), return it
    const query = userId ? { long, userId } : { long, userId: null };
    const existing = await Url.findOne(query);
    if (existing) {
      return res.status(200).json(existing);
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "url" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const shortCode = encodeBase62(counter.seq);

    const expiresAt = expirySeconds
      ? new Date(Date.now() + expirySeconds * 1000)
      : null;

    const data = await Url.create({
      long,
      short: shortCode,
      expiresAt,
      userId,
    });

    res.status(201).json(data);
  } catch (err) {
    console.error("Shorten error:", err);
    res.status(500).json({ message: "Failed to shorten URL" });
  }
};

// GET /:code (Hot Path)
const getOne = async (req, res) => {
  try {
    const { code } = req.params;

    // 1. Cache-aside check in Redis (avoids DB roundtrip on cache hit)
    const cachedUrl = await redisClient.get(code);
    if (cachedUrl) {
      enqueueClick(code); // async, fire-and-forget
      return res.redirect(cachedUrl);
    }

    // 2. Cache miss: fallback to MongoDB
    const data = await Url.findOne({ short: code });
    if (!data) {
      return res.status(404).json({ message: "URL not found or expired" });
    }

    // Check application-level TTL expiration
    if (data.expiresAt && data.expiresAt < new Date()) {
      await Url.deleteOne({ _id: data._id });
      return res.status(410).json({ message: "URL has expired" });
    }

    // 3. Populate Redis cache for future requests
    await redisClient.setEx(code, CACHE_TTL, data.long);
    enqueueClick(code);

    return res.redirect(data.long);
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).json({ message: "Redirect failed" });
  }
};

// GET /user/urls (User Dashboard)
const getUserUrls = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const urls = await Url.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(urls);
  } catch (err) {
    console.error("Fetch user URLs error:", err);
    return res.status(500).json({ message: "Failed to fetch user URLs" });
  }
};

// Async Redis queue push for eventual consistency
const enqueueClick = async (shortCode) => {
  try {
    const event = JSON.stringify({
      shortCode,
      ts: Date.now(),
    });
    await redisClient.lPush("analytics:clicks", event);
  } catch (err) {
    console.error("Failed to enqueue click:", err);
  }
};

module.exports = { short, getOne, getUserUrls, enqueueClick };
