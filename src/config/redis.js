const Redis = require('ioredis');

const options = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 5) {
      console.log('⚠️ Redis not available');
      return null;
    }
    return Math.min(times * 200, 2000);
  }
};

// REDIS_URL (Upstash/Render) ho toh wo use karo, warna local host/port
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL.trim(), options)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...options
    });

redis.on('connect', () => console.log('✅ Redis Connected!'));
redis.on('error', (err) => console.log('⚠️ Redis Error:', err.message));

module.exports = redis;