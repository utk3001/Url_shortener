require("dotenv").config();
const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis error", err);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Connected to Redis");
  }
};

module.exports = { redisClient, connectRedis };
