const Meeting = require('../models/Meeting');
const generateMeetingCode = require('../utils/generateMeetingCode');
const { getIceServers } = require('../config/webrtc');

// @route POST /api/meetings/create
const createMeeting = async (req, res) => {
  try {
    const { title, description, maxParticipants } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Meeting title is required'
      });
    }

    const meetingCode = generateMeetingCode();

    const meeting = await Meeting.create({
      title,
      description,
      meetingCode,
      host: req.user._id,
      maxParticipants: maxParticipants || 50,
      participants: [{
        user: req.user._id,
        role: 'host'
      }]
    });

    const iceServers = getIceServers();

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully!',
      meeting: {
        id: meeting._id,
        title: meeting.title,
        meetingCode: meeting.meetingCode,
        status: meeting.status,
        host: req.user._id,
        startTime: meeting.startTime
      },
      iceServers
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/meetings/join
const joinMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;

    if (!meetingCode) {
      return res.status(400).json({
        success: false,
        message: 'Meeting code is required'
      });
    }

    const meeting = await Meeting.findOne({ meetingCode })
      .populate('host', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Meeting has ended'
      });
    }

    const alreadyJoined = meeting.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      if (meeting.participants.length >= meeting.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Meeting is full'
        });
      }

      meeting.participants.push({
        user: req.user._id,
        role: 'participant'
      });
      await meeting.save();
    }

    const iceServers = getIceServers();

    res.status(200).json({
      success: true,
      message: 'Joined meeting successfully!',
      meeting: {
        id: meeting._id,
        title: meeting.title,
        meetingCode: meeting.meetingCode,
        status: meeting.status,
        host: meeting.host,
        participants: meeting.participants.length
      },
      iceServers
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/meetings
const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ]
    })
    .populate('host', 'name email avatar')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/meetings/:id
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.status(200).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/meetings/:id/end
const endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only host can end the meeting'
      });
    }

    meeting.status = 'ended';
    meeting.endTime = new Date();
    meeting.duration = Math.round(
      (meeting.endTime - meeting.startTime) / 60000
    );
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully!',
      duration: meeting.duration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/meetings/:id
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only host can delete the meeting'
      });
    }

    await Meeting.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully!'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMeeting,
  joinMeeting,
  getAllMeetings,
  getMeeting,
  endMeeting,
  deleteMeeting
};