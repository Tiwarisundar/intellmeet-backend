const dns = require('dns');
const mongoose = require('mongoose');

// Windows/ISP DNS SRV lookup block kar deta hai, isliye Google/Cloudflare DNS force karo
dns.setServers(['8.8.8.8', '1.1.1.1']);

const LOCAL_URI = 'mongodb://localhost:27017/intellmeet';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  // 1) Pehle .env wali URI try karo (Atlas)
  if (uri) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.log('❌ MongoDB (.env URI) Error:', error.message);
      console.log('↪️  Local MongoDB try kar raha hoon...');
    }
  } else {
    console.log('⚠️ .env mein MONGODB_URI nahi mila, local MongoDB try kar raha hoon...');
  }

  // 2) Fallback: local MongoDB
  try {
    const conn = await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log('❌ Local MongoDB bhi connect nahi hua:', error.message);
    console.log('👉 Atlas: Network Access mein 0.0.0.0/0 allow karo, ya local mongod service start karo.');
    process.exit(1);
  }
};

module.exports = connectDB;