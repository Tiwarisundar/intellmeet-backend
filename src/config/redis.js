const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      console.log("⚠️ Redis not available");
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on("connect", () => {
  console.log("✅ Redis Connected!");
});

redis.on("error", (err) => {
  console.log("❌ Redis Error:", err.message);
});

module.exports = redis;