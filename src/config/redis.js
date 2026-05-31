const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    if (times > 3) {
      console.log('⚠️ Redis not available - running without cache');
      return null;
    }
    return Math.min(times * 100, 3000);
  }
});

redis.on('connect', () => console.log('✅ Redis Connected!'));
redis.on('error', (err) => console.log('⚠️ Redis Error:', err.message));

module.exports = redis;