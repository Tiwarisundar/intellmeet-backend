const dns = require('dns');
const mongoose = require('mongoose');

const isProd = process.env.NODE_ENV === 'production';

// Google DNS sirf local PC pe force karo
if (!isProd) dns.setServers(['8.8.8.8', '1.1.1.1']);

const LOCAL_URI = 'mongodb://localhost:27017/intellmeet';

// Value ke andar se asli mongodb URL nikaalo (prefix, quotes, space sab ignore)
const extractUri = (raw = '') => {
  const match = raw.match(/mongodb(\+srv)?:\/\/[^\s"']+/i);
  return match ? match[0] : '';
};

const connectDB = async () => {
  const raw = process.env.MONGODB_URI || process.env.MONGO_URI || '';
  const uri = extractUri(raw);

  // Password chhupa ke sirf diagnostic dikhao
  console.log('🔌 Raw value starts with:', JSON.stringify(raw.slice(0, 14)));
  console.log('🔌 Parsed URI starts with:', uri.slice(0, 14) || '(kuch nahi mila)');

  if (uri) {
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
    console.log('⚠️ MONGODB_URI set nahi hai ya format galat hai');
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