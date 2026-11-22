const { redisClient } = require("../cache/redis");

/**
 * Distributed Sliding-Window Rate Limiter using Redis Sorted Sets and Lua script.
 *
 * How it works across distributed API clusters:
 * 1. Redis key stores sorted set (ZSET) where:
 *    - Score = request timestamp in milliseconds
 *    - Member = unique request token (timestamp:seq)
 * 2. An atomic Lua script executes in Redis:
 *    - Cleans all entries older than (now - windowMs) with ZREMRANGEBYSCORE.
 *    - Counts remaining valid requests within current sliding window with ZCARD.
 *    - If count < max: adds current request to ZSET, updates TTL, and allows request.
 *    - If count >= max: denies request, returning 429 Too Many Requests.
 *
 * This eliminates the burst/boundary vulnerabilities of fixed-window counters
 * and guarantees zero race conditions across distributed server instances.
 */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxHits = tonumber(ARGV[3])
local clearBefore = now - windowMs

-- 1. Remove expired timestamps outside the sliding window
redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)

-- 2. Count requests currently in the sliding window
local currentRequests = redis.call('ZCARD', key)

if currentRequests < maxHits then
  -- Allowed: increment counter for unique member identifier
  local seq = redis.call('INCR', key .. ':seq')
  local member = now .. ':' .. seq
  redis.call('ZADD', key, now, member)
  -- Refresh TTL to ensure memory cleanup during inactivity
  redis.call('PEXPIRE', key, windowMs)
  redis.call('PEXPIRE', key .. ':seq', windowMs)
  local remaining = maxHits - currentRequests - 1
  return { 1, remaining, windowMs }
else
  -- Denied: quota reached
  redis.call('PEXPIRE', key, windowMs)
  return { 0, 0, windowMs }
end
`.trim();

const slidingWindowLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    prefix = "rl:sw:",
    message = "Too many requests. Try later.",
  } = options;

  return async (req, res, next) => {
    try {
      if (!redisClient.isOpen) {
        // Fall back gracefully if Redis is temporarily unreachable
        return next();
      }

      // Enforce per-client quota (identifies logged-in user or client IP)
      const clientIdentifier = req.user?.id
        ? `user:${req.user.id}`
        : `ip:${req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || req.socket.remoteAddress || "unknown"}`;

      const key = `${prefix}${clientIdentifier}`;
      const now = Date.now();

      const result = await redisClient.sendCommand([
        "EVAL",
        SLIDING_WINDOW_LUA,
        "1",
        key,
        String(now),
        String(windowMs),
        String(max),
      ]);

      const [allowed, remaining, resetMs] = result;

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining));
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + Number(resetMs)) / 1000));

      if (allowed === 1) {
        return next();
      }

      res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
      return res.status(429).json({
        message,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
    } catch (err) {
      console.error("Sliding-window rate limiter error:", err);
      // Fail open to avoid blocking legitimate traffic in case of limiter error
      return next();
    }
  };
};

const createRateLimiters = () => {
  if (!redisClient.isOpen) {
    throw new Error("Redis client not connected");
  }

  const createLimiter = slidingWindowLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    prefix: "rl:sw:create:",
    message: "Too many URL creation requests. Try later.",
  });

  const redirectLimiter = slidingWindowLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 300,
    prefix: "rl:sw:redirect:",
    message: "Too many redirect requests. Try later.",
  });

  return { createLimiter, redirectLimiter, slidingWindowLimiter };
};

module.exports = { createRateLimiters, slidingWindowLimiter };
