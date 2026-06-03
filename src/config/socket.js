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
    console.log(`User connected: ${socket.id}`);

    // Meeting join karo
    socket.on('join-meeting', async ({ meetingId, userId, userName, isHost }) => {
      socket.join(meetingId);

      // Host ka socket ID store karo
      if (isHost) {
        await redis.set(`meeting:${meetingId}:host_socket`, socket.id);
      }

      await redis.hset(`meeting:${meetingId}:participants`, userId, JSON.stringify({
        userId, userName, socketId: socket.id, joinedAt: new Date()
      }));

      socket.to(meetingId).emit('user-joined', { userId, userName, socketId: socket.id });

      const participants = await redis.hgetall(`meeting:${meetingId}:participants`);
      io.to(meetingId).emit('participants-list',
        Object.values(participants).map(p => JSON.parse(p))
      );

      console.log(`👤 ${userName} joined meeting: ${meetingId}`);
    });

    // Join request — 4th attempt pe host se permission lo
    socket.on('request-join', async ({ meetingId, userId, userName }) => {
      const hostSocketId = await redis.get(`meeting:${meetingId}:host_socket`);

      if (hostSocketId) {
        // Host ko request bhejo
        io.to(hostSocketId).emit('join-request', {
          userId,
          userName,
          socketId: socket.id,
          meetingId
        });
        console.log(`Join request from ${userName} to host`);
      } else {
        // Koi host nahi — auto approve karo
        socket.emit('join-approved', { meetingId });
      }
    });

    // Host approve karta hai
    socket.on('approve-join', ({ socketId, meetingId, userName }) => {
      io.to(socketId).emit('join-approved', { meetingId });
      console.log(`Join approved for socket: ${socketId}`);
    });

    // Host reject karta hai
    socket.on('reject-join', ({ socketId, userName }) => {
      io.to(socketId).emit('join-rejected', { reason: 'Host rejected your request' });
      console.log(`Join rejected for socket: ${socketId}`);
    });

    // Meeting leave
    socket.on('leave-meeting', async ({ meetingId, userId, userName }) => {
      socket.leave(meetingId);
      await redis.hdel(`meeting:${meetingId}:participants`, userId);
      socket.to(meetingId).emit('user-left', { userId, userName });
      console.log(` ${userName} left meeting: ${meetingId}`);
    });

    // Chat message
    socket.on('send-message', async ({ meetingId, userId, userName, message }) => {
      const msgData = {
        id: Date.now(),
        userId, userName, message,
        timestamp: new Date().toISOString()
      };
      await redis.lpush(`meeting:${meetingId}:messages`, JSON.stringify(msgData));
      await redis.ltrim(`meeting:${meetingId}:messages`, 0, 99);
      io.to(meetingId).emit('receive-message', msgData);
    });

    // Chat history
    socket.on('get-messages', async ({ meetingId }) => {
      const messages = await redis.lrange(`meeting:${meetingId}:messages`, 0, -1);
      socket.emit('messages-history', messages.map(m => JSON.parse(m)).reverse());
    });

    // Typing
    socket.on('typing', ({ meetingId, userId, userName }) => {
      socket.to(meetingId).emit('user-typing', { userId, userName });
    });

    socket.on('stop-typing', ({ meetingId, userId }) => {
      socket.to(meetingId).emit('user-stop-typing', { userId });
    });

    // WebRTC Signaling
    socket.on('webrtc-offer', ({ meetingId, offer, fromId }) => {
      socket.to(meetingId).emit('webrtc-offer', { offer, fromId });
    });

    socket.on('webrtc-answer', ({ meetingId, answer, fromId }) => {
      socket.to(meetingId).emit('webrtc-answer', { answer, fromId });
    });

    socket.on('ice-candidate', ({ meetingId, candidate, fromId }) => {
      socket.to(meetingId).emit('ice-candidate', { candidate, fromId });
    });

    // Mute/Video toggle
    socket.on('toggle-mute', ({ meetingId, userId, isMuted }) => {
      socket.to(meetingId).emit('user-mute-changed', { userId, isMuted });
    });

    socket.on('toggle-video', ({ meetingId, userId, isVideoOff }) => {
      socket.to(meetingId).emit('user-video-changed', { userId, isVideoOff });
    });

    // Notification
    socket.on('send-notification', ({ meetingId, type, message, fromUser }) => {
      io.to(meetingId).emit('receive-notification', {
        id: Date.now(), type, message, fromUser,
        timestamp: new Date().toISOString()
      });
    });

    // Raise Hand
socket.on('raise-hand', ({ meetingId, userId, userName }) => {
  io.to(meetingId).emit('hand-raised', { userId, userName });
});

socket.on('lower-hand', ({ meetingId, userId }) => {
  io.to(meetingId).emit('hand-lowered', { userId });
});

// Screen Share
socket.on('screen-share-started', ({ meetingId, userId, userName }) => {
  io.to(meetingId).emit('user-screen-sharing', { userId, userName });
});

socket.on('screen-share-stopped', ({ meetingId, userId }) => {
  io.to(meetingId).emit('user-screen-share-stopped', { userId });
});

// Report Abuse
socket.on('report-user', ({ meetingId, reportedUserId, reportedUserName, reason, reportedBy }) => {
  console.log(` Report: ${reportedUserName} reported by ${reportedBy} for: ${reason}`);
  socket.emit('report-submitted', { success: true });
});

// Captions
socket.on('caption-text', ({ meetingId, userId, userName, text }) => {
  socket.to(meetingId).emit('receive-caption', { userId, userName, text });
});

    socket.on('disconnect', async () => {
      console.log(` User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;