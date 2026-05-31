const { Server } = require('socket.io');
const redis = require('./redis');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Meeting room join karo
    socket.on('join-meeting', async ({ meetingId, userId, userName }) => {
      socket.join(meetingId);
      
      // Redis mein participant store karo
      await redis.hset(`meeting:${meetingId}:participants`, userId, JSON.stringify({
        userId, userName, socketId: socket.id, joinedAt: new Date()
      }));

      // Baaki participants ko notify karo
      socket.to(meetingId).emit('user-joined', { userId, userName, socketId: socket.id });

      // Active participants list bhejo
      const participants = await redis.hgetall(`meeting:${meetingId}:participants`);
      io.to(meetingId).emit('participants-list', Object.values(participants).map(p => JSON.parse(p)));

      console.log(`👤 ${userName} joined meeting: ${meetingId}`);
    });

    // Meeting room leave karo
    socket.on('leave-meeting', async ({ meetingId, userId, userName }) => {
      socket.leave(meetingId);
      
      await redis.hdel(`meeting:${meetingId}:participants`, userId);
      
      socket.to(meetingId).emit('user-left', { userId, userName });

      console.log(`👋 ${userName} left meeting: ${meetingId}`);
    });

    // Real-time chat message
    socket.on('send-message', async ({ meetingId, userId, userName, message }) => {
      const msgData = {
        id: Date.now(),
        userId,
        userName,
        message,
        timestamp: new Date().toISOString()
      };

      // Redis mein message store karo
      await redis.lpush(`meeting:${meetingId}:messages`, JSON.stringify(msgData));
      await redis.ltrim(`meeting:${meetingId}:messages`, 0, 99); // Max 100 messages

      // Sab participants ko message bhejo
      io.to(meetingId).emit('receive-message', msgData);
    });

    // Chat history load karo
    socket.on('get-messages', async ({ meetingId }) => {
      const messages = await redis.lrange(`meeting:${meetingId}:messages`, 0, -1);
      const parsed = messages.map(m => JSON.parse(m)).reverse();
      socket.emit('messages-history', parsed);
    });

    // Typing indicator
    socket.on('typing', ({ meetingId, userId, userName }) => {
      socket.to(meetingId).emit('user-typing', { userId, userName });
    });

    socket.on('stop-typing', ({ meetingId, userId }) => {
      socket.to(meetingId).emit('user-stop-typing', { userId });
    });

    // WebRTC Signaling
    socket.on('webrtc-offer', ({ meetingId, offer, fromId, toId }) => {
      socket.to(meetingId).emit('webrtc-offer', { offer, fromId });
    });

    socket.on('webrtc-answer', ({ meetingId, answer, fromId }) => {
      socket.to(meetingId).emit('webrtc-answer', { answer, fromId });
    });

    socket.on('ice-candidate', ({ meetingId, candidate, fromId }) => {
      socket.to(meetingId).emit('ice-candidate', { candidate, fromId });
    });

    // Mute/Unmute
    socket.on('toggle-mute', ({ meetingId, userId, isMuted }) => {
      socket.to(meetingId).emit('user-mute-changed', { userId, isMuted });
    });

    // Video on/off
    socket.on('toggle-video', ({ meetingId, userId, isVideoOff }) => {
      socket.to(meetingId).emit('user-video-changed', { userId, isVideoOff });
    });

    // Notification bhejo
    socket.on('send-notification', ({ meetingId, type, message, fromUser }) => {
      const notification = {
        id: Date.now(),
        type,
        message,
        fromUser,
        timestamp: new Date().toISOString()
      };
      io.to(meetingId).emit('receive-notification', notification);
    });

    // Disconnect handle karo
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;