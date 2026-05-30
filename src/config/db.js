const mongoose = require('mongoose');

const DEFAULT_RETRIES = 5;
const DEFAULT_INTERVAL = 5000; // ms

const connectDB = async ({ retries = DEFAULT_RETRIES, interval = DEFAULT_INTERVAL } = {}) => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MongoDB Error: MONGODB_URI is not set in environment (.env)');
    process.exit(1);
  }

  let attempt = 0;
  while (attempt <= retries) {
    try {
      attempt += 1;
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

      // Attach error handler so runtime disconnects get logged
      mongoose.connection.on('error', (err) => {
        console.error('⚠️ MongoDB runtime error:', err.stack || err);
      });

      return conn;
    } catch (error) {
      console.error(`❌ MongoDB connect attempt ${attempt} failed: ${error.message}`);
      console.error(error.stack);

      if (attempt > retries) {
        console.error('❌ MongoDB Error: exceeded max retries. Exiting.');
        process.exit(1);
      }

      console.log(`Retrying MongoDB connection in ${interval}ms... (attempt ${attempt + 1}/${retries + 1})`);
      // wait before retry
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, interval));
    }
  }
};

module.exports = connectDB;