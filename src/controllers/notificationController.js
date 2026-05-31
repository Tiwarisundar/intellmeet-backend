const Notification = require('../models/Notification');

// @route GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read!',
      notification
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read!'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted!'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/notifications/send
const sendNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, meetingId } = req.body;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type,
      title,
      message,
      meetingId
    });

    // Socket.io se real-time notification bhejo
    const io = req.app.get('io');
    io.emit(`notification:${recipientId}`, {
      id: notification._id,
      type,
      title,
      message,
      sender: req.user.name,
      timestamp: notification.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent!',
      notification
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification
};