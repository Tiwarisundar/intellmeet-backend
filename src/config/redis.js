const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => console.log("✅ Redis Connected!"));
redis.on("error", (err) => console.log("⚠️ Redis Error:", err.message));

module.exports = redis;