require("dotenv").config();
const mongoose = require("mongoose");
const { redisClient, connectRedis } = require("../cache/redis");
const Url = require("../models/url");

const startWorker = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  await connectRedis();

  console.log("Analytics worker started");

  while (true) {
    try {
      // Blocking pop (waits until event exists)
      const result = await redisClient.brPop("analytics:clicks", 0);
      const event = JSON.parse(result.element);

      await Url.updateOne(
        { short: event.shortCode },
        { $inc: { clicks: 1 } }
      );
    } catch (err) {
      console.error("Worker error", err);
    }
  }
};

startWorker();
