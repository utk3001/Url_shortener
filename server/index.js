const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const { connectRedis } = require("./cache/redis");
const { createRateLimiters } = require("./middleware/rateLimiter");
const urlRoutes = require("./routes/url");

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

    await connectRedis(); // 🔥 Redis is open NOW

    // Create limiters AFTER Redis is ready
    const { createLimiter, redirectLimiter } = createRateLimiters();

    // Inject them into routes
    app.use("/api/v1", urlRoutes(createLimiter, redirectLimiter));

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Startup failure:", err);
    process.exit(1);
  }
};

startServer();
