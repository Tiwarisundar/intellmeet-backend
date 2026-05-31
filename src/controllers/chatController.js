const Message = require('../models/Message');
const redis = require('../config/redis');

// @route GET /api/chat/:meetingId/messages
const getMessages = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Pehle Redis cache check karo
    const cached = await redis.lrange(`meeting:${meetingId}:messages`, 0, -1);
    
    if (cached.length > 0) {
      const messages = cached.map(m => JSON.parse(m)).reverse();
      return res.status(200).json({
        success: true,
        source: 'cache',
        count: messages.length,
        messages
      });
    }

    // Cache miss — MongoDB se lo
    const messages = await Message.find({ meetingId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      source: 'database',
      count: messages.length,
      messages
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/chat/:meetingId/messages
const saveMessage = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // MongoDB mein save karo
    const newMessage = await Message.create({
      meetingId,
      sender: req.user._id,
      senderName: req.user.name,
      message
    });

    // Socket.io se real-time broadcast karo
    const io = req.app.get('io');
    io.to(meetingId).emit('receive-message', {
      id: newMessage._id,
      userId: req.user._id,
      userName: req.user.name,
      message: newMessage.message,
      timestamp: newMessage.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Message sent!',
      data: newMessage
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/chat/:meetingId/messages
const clearMessages = async (req, res) => {
  try {
    const { meetingId } = req.params;

    await Message.deleteMany({ meetingId });
    await redis.del(`meeting:${meetingId}:messages`);

    res.status(200).json({
      success: true,
      message: 'Chat cleared successfully!'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, saveMessage, clearMessages };