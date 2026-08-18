const Url = require("../models/url");
const { redisClient } = require("../cache/redis");
const Counter = require("../models/counter");
const { encodeBase62 } = require("../utility/base62");

const CACHE_TTL = 60 * 60; // 1 hour
// POST /shorten
const short = async (req, res) => {
  try {
    const { long, expiresIn } = req.body;

    const existing = await Url.findOne({ long });
    if (existing) {
      return res.status(200).json(existing);
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "url" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const shortCode = encodeBase62(counter.seq);

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    const data = await Url.create({
      long,
      short: shortCode,
      expiresAt,
    });

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to shorten URL" });
  }
};


const getOne = async (req, res) => {
  try {
    const { code } = req.params;

    const cachedUrl = await redisClient.get(code);
    if (cachedUrl) {
      enqueueClick(code); // async, fire-and-forget
      return res.redirect(cachedUrl);
    }

    const data = await Url.findOne({ short: code });
    if (!data) {
      return res.status(404).json({ message: "URL not found or expired" });
    }

    if (data.expiresAt && data.expiresAt < new Date()) {
      await Url.deleteOne({ _id: data._id });
      return res.status(410).json({ message: "URL has expired" });
    }

    await redisClient.setEx(code, 3600, data.long);
    enqueueClick(code);

    return res.redirect(data.long);
  } catch (err) {
    res.status(500).json({ message: "Redirect failed" });
  }
};


const enqueueClick = async (shortCode) => {
  const event = JSON.stringify({
    shortCode,
    ts: Date.now(),
  });

  await redisClient.lPush("analytics:clicks", event);
};


module.exports = { short, getOne };
