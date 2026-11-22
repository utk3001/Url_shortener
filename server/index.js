const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const { connectRedis } = require("./cache/redis");
const { createRateLimiters } = require("./middleware/rateLimiter");
const { getOne } = require("./controllers/url");
const { startWorker } = require("./workers/analyticsWorker");
const urlRoutes = require("./routes/url");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(express.json());
app.use(cors());

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to Database");

    await connectRedis(); // Redis connected

    // Create distributed sliding-window limiters AFTER Redis is ready
    const { createLimiter, redirectLimiter } = createRateLimiters();

    // Mount Auth routes (JWT registration, login, profile)
    app.use("/api/v1/auth", authRoutes);

    // Mount URL routes (shorten, redirect, user dashboard)
    app.use("/api/v1", urlRoutes(createLimiter, redirectLimiter));

    // Also support root redirect directly: GET /:code (e.g. http://localhost:3001/:code)
    app.get("/:code", redirectLimiter, getOne);

    // Auto-start background analytics worker in standalone mode (local dev or single-container deployments like Render)
    if (process.env.STANDALONE_WORKER !== "false") {
      startWorker().catch((err) => console.error("Worker startup error:", err));
    }

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Startup failure:", err);
    process.exit(1);
  }
};

startServer();
