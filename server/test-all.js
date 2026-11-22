const assert = require("assert");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { encodeBase62 } = require("./utility/base62");
const { JWT_SECRET, requireAuth, optionalAuth } = require("./middleware/auth");

async function runTests() {
  console.log("=== RUNNING VERIFICATION SUITE ===");

  // 1. Base62 Verification
  console.log("Testing Base62 encoding...");
  assert.strictEqual(encodeBase62(0), "0");
  assert.strictEqual(encodeBase62(1), "1");
  assert.strictEqual(encodeBase62(61), "Z");
  assert.strictEqual(encodeBase62(62), "10");
  assert.strictEqual(encodeBase62(125), "21");
  console.log("✔ Base62 encoding passed!");

  // 2. JWT Generation & Verification
  console.log("Testing JWT generation and verification...");
  const payload = { id: "user_test_123", email: "test@example.com" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  assert(typeof token === "string" && token.split(".").length === 3);

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.strictEqual(decoded.id, payload.id);
  assert.strictEqual(decoded.email, payload.email);
  console.log("✔ JWT verification passed!");

  // 3. Bcrypt Password Hashing & Comparison
  console.log("Testing Bcrypt password hashing & matching...");
  const rawPassword = "securePassword123!";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPassword, salt);
  assert.notStrictEqual(hash, rawPassword);
  const isMatch = await bcrypt.compare(rawPassword, hash);
  assert.strictEqual(isMatch, true);
  const isWrong = await bcrypt.compare("wrongPassword", hash);
  assert.strictEqual(isWrong, false);
  console.log("✔ Bcrypt hashing & comparison passed!");

  // 4. Auth Middleware Tests
  console.log("Testing Auth middlewares...");
  // requireAuth with missing header
  let resStatus = null;
  let resJson = null;
  const mockRes = {
    status: (s) => {
      resStatus = s;
      return {
        json: (j) => {
          resJson = j;
        },
      };
    },
  };

  const reqNoAuth = { headers: {} };
  let nextCalled = false;
  requireAuth(reqNoAuth, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(resStatus, 401);
  assert.strictEqual(nextCalled, false);

  // requireAuth with valid token
  const reqWithAuth = { headers: { authorization: `Bearer ${token}` } };
  nextCalled = false;
  requireAuth(reqWithAuth, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(reqWithAuth.user.id, payload.id);

  // optionalAuth with no token (should proceed without user)
  const reqOptionalGuest = { headers: {} };
  nextCalled = false;
  optionalAuth(reqOptionalGuest, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(reqOptionalGuest.user, undefined);

  // optionalAuth with valid token (should attach user)
  const reqOptionalUser = { headers: { authorization: `Bearer ${token}` } };
  nextCalled = false;
  optionalAuth(reqOptionalUser, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(reqOptionalUser.user.id, payload.id);
  console.log("✔ Auth middleware tests passed!");

  // 5. Sliding-Window Rate Limiter Simulation
  console.log("Testing Sliding-Window algorithm logic...");
  const windowMs = 1000;
  const max = 3;
  const slidingLog = []; // simulates Redis ZSET with [timestamp, member]

  function simulateSlidingWindow(now) {
    const clearBefore = now - windowMs;
    // ZREMRANGEBYSCORE key -inf clearBefore
    for (let i = slidingLog.length - 1; i >= 0; i--) {
      if (slidingLog[i].score <= clearBefore) {
        slidingLog.splice(i, 1);
      }
    }
    // ZCARD key
    const currentHits = slidingLog.length;
    if (currentHits < max) {
      slidingLog.push({ score: now, member: `${now}:${slidingLog.length + 1}` });
      return { allowed: true, remaining: max - currentHits - 1 };
    }
    return { allowed: false, remaining: 0 };
  }

  // 3 quick requests at t=100, 200, 300
  assert.strictEqual(simulateSlidingWindow(100).allowed, true);
  assert.strictEqual(simulateSlidingWindow(200).allowed, true);
  assert.strictEqual(simulateSlidingWindow(300).allowed, true);
  // 4th request at t=400 should be BLOCKED (exceeds max=3 within 1000ms)
  assert.strictEqual(simulateSlidingWindow(400).allowed, false);

  // At t=1150 (more than 1000ms after t=100), the request at t=100 slides out of window!
  assert.strictEqual(simulateSlidingWindow(1150).allowed, true);
  console.log("✔ Sliding-window algorithm simulation passed!");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
