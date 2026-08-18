const rateLimit = require("express-rate-limit");
const { default: RedisStore } = require("rate-limit-redis");
const { redisClient } = require("../cache/redis");

const createRateLimiters = () => {
  if (!redisClient.isOpen) {
    throw new Error("Redis client not connected");
  }

  const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: "rl:create:",
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    message: {
      message: "Too many URL creation requests. Try later.",
    },
  });

  const redirectLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: "rl:redirect:",
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
  });

  return { createLimiter, redirectLimiter };
};

module.exports = { createRateLimiters };
