require("dotenv").config();
const mongoose = require("mongoose");
const { redisClient, connectRedis } = require("../cache/redis");
const Url = require("../models/url");

/**
 * Analytics Worker
 *
 * Runs as an asynchronous background consumer:
 * 1. Uses a dedicated duplicate Redis client for blocking pop (BRPOP)
 * 2. Pulls click events from "analytics:clicks" queue
 * 3. Asynchronously increments the click counter in MongoDB
 *
 * This keeps the HTTP redirect path (hot path) sub-10ms without blocking on database writes.
 */
const startWorker = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URL);
  }
  await connectRedis();

  // Create dedicated Redis client for BRPOP so it doesn't block the main API client
  const workerClient = redisClient.duplicate();
  await workerClient.connect();

  console.log("Analytics worker started (listening for click events on Redis queue)");

  while (true) {
    try {
      // Blocking pop (waits until an event is pushed)
      const result = await workerClient.brPop("analytics:clicks", 0);
      if (result && result.element) {
        const event = JSON.parse(result.element);

        await Url.updateOne(
          { short: event.shortCode },
          { $inc: { clicks: 1 } }
        );
        console.log(`[Analytics] +1 click recorded for short code: /${event.shortCode}`);
      }
    } catch (err) {
      console.error("Worker processing error:", err);
      // Wait 1 second before retrying on error
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

// If run directly (e.g. `node workers/analyticsWorker.js` in Docker container)
if (require.main === module) {
  startWorker();
}

module.exports = { startWorker };
