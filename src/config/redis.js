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

const extractRedisUrl = (raw = '') => {
  const match = raw.match(/rediss?:\/\/[^\s"']+/i);
  return match ? match[0] : '';
};

let redisUrl = extractRedisUrl(process.env.REDIS_URL || '');

// Upstash ko TLS chahiye
if (redisUrl && /upstash\.io/i.test(redisUrl)) {
  redisUrl = redisUrl.replace(/^redis:\/\//i, 'rediss://');
}

console.log(
  '🔌 Redis mode:',
  redisUrl
    ? `URL -> ${redisUrl.split('://')[0]}://...@${redisUrl.split('@')[1]}`
    : 'localhost (REDIS_URL nahi mila)'
);

const redis = redisUrl
  ? new Redis(redisUrl, options)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...options
    });

redis.on('connect', () => console.log('✅ Redis Connected!'));
redis.on('error', (err) => {
  const code = err.code || err.errors?.map((e) => e.code).join(',') || err.name;
  console.log('⚠️ Redis Error:', err.message || '(no message)', '| code:', code);
});

module.exports = redis;