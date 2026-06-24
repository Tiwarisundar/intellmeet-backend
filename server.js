require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const initSocket = require('./src/config/socket');
require('./src/config/redis');

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

server.listen(PORT, () => {
  console.log(`🚀 IntellMeet Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});