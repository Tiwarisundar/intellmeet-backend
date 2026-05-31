const express = require('express');
const router = express.Router();
const {
  createMeeting,
  joinMeeting,
  getAllMeetings,
  getMeeting,
  endMeeting,
  deleteMeeting
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

router.post('/create', protect, createMeeting);
router.post('/join', protect, joinMeeting);
router.get('/', protect, getAllMeetings);
router.get('/:id', protect, getMeeting);
router.put('/:id/end', protect, endMeeting);
router.delete('/:id', protect, deleteMeeting);

module.exports = router;