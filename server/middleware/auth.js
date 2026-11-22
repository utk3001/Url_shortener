const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "url_shortener_jwt_secret_key_2025";

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Required authentication middleware.
 * Returns 401 if token is missing, invalid, or expired.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Optional authentication middleware.
 * If Bearer token is provided, decodes and attaches user to req.user.
 * Otherwise, allows request to proceed as guest.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (err) {
      // Continue without user if token is invalid
    }
  }
  next();
};

module.exports = { requireAuth, optionalAuth, JWT_SECRET };
