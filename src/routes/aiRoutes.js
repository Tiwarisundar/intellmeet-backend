const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  generateSummary,
  extractActionItems,
  getMeetingSummary,
  aiMeetingChat,
  transcribeAudio
} = require('../controllers/aiController');

// Debug check
console.log('AI Controller functions:', {
  generateSummary: typeof generateSummary,
  extractActionItems: typeof extractActionItems,
  getMeetingSummary: typeof getMeetingSummary,
  aiMeetingChat: typeof aiMeetingChat,
  transcribeAudio: typeof transcribeAudio
});

router.post('/summary', protect, generateSummary);
router.post('/action-items', protect, extractActionItems);
router.get('/summary/:meetingId', protect, getMeetingSummary);
router.post('/chat', protect, aiMeetingChat);

module.exports = router;