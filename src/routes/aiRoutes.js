const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  transcribeAudio,
  generateSummary,
  extractActionItems,
  getMeetingSummary,
  aiMeetingChat
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', protect, upload.single('audio'), transcribeAudio);
router.post('/summary', protect, generateSummary);
router.post('/action-items', protect, extractActionItems);
router.get('/summary/:meetingId', protect, getMeetingSummary);
router.post('/chat', protect, aiMeetingChat);

module.exports = router;