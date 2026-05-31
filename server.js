require('dotenv').config();
require('./src/config/redis');
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const initSocket = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// initialize Socket.IO
const io = initSocket(server);

// Global accessible
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 IntellMeet Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});