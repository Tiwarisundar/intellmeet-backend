const dns = require('dns');
const mongoose = require('mongoose');

const isProd = process.env.NODE_ENV === 'production';

// Google DNS sirf local PC pe force karo, Render pe iski zaroorat nahi
if (!isProd) dns.setServers(['8.8.8.8', '1.1.1.1']);

const LOCAL_URI = 'mongodb://localhost:27017/intellmeet';

const connectDB = async () => {
  // Quotes ya extra space hata do
  const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (uri) {
    const host = uri.split('@')[1]?.split('/')[0];
    console.log('🔌 MongoDB host:', host || '(URI format galat lag raha hai)');
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.log('❌ MongoDB Error:', error.message);
      if (isProd) process.exit(1);
      console.log('↪️ Local MongoDB try kar raha hoon...');
    }
  } else {
    console.log('⚠️ MONGODB_URI set nahi hai');
    if (isProd) process.exit(1);
  }

  try {
    const conn = await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log('❌ Local MongoDB bhi connect nahi hua:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;