const express = require("express");
const { short, getOne, getUserUrls } = require("../controllers/url");
const { requireAuth, optionalAuth } = require("../middleware/auth");

module.exports = (createLimiter, redirectLimiter) => {
  const router = express.Router();

  // Create short URL: protected by distributed sliding-window rate limiter + optional JWT auth
  router.post("/shorten", createLimiter, optionalAuth, short);

  // Authenticated user URLs for dashboard analytics
  router.get("/user/urls", requireAuth, getUserUrls);

  // Hot redirect path: protected by distributed sliding-window rate limiter
  router.get("/:code", redirectLimiter, getOne);

  return router;
};
