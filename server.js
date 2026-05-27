require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const initSocket = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

// Database connect karo
connectDB();

// HTTP server banao
const server = http.createServer(app);

// Socket.io initialize karo
const io = initSocket(server);

// Global accessible
app.set('io', io);

// Server start karo
server.listen(PORT, () => {
  console.log(`🚀 IntellMeet Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});