const express = require('express');
const router = express.Router();
const {
  getMessages,
  saveMessage,
  clearMessages
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:meetingId/messages', protect, getMessages);
router.post('/:meetingId/messages', protect, saveMessage);
router.delete('/:meetingId/messages', protect, clearMessages);

module.exports = router;