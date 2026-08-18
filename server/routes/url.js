const express = require("express");
const { short, getOne } = require("../controllers/url");

module.exports = (createLimiter, redirectLimiter) => {
  const router = express.Router();

  router.post("/shorten", createLimiter, short);
  router.get("/:code", redirectLimiter, getOne);

  return router;
};
