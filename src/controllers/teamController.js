const Team = require('../models/Team');

// GET /api/teams
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('owner', 'name avatar');

    res.status(200).json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/teams
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Team name required' });
    }

    const team = await Team.create({
      name,
      description,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        name: req.user.name,
        role: 'admin'
      }]
    });

    res.status(201).json({ success: true, message: 'Team created!', team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/teams/:id
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/teams/:id
const deleteTeam = async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Team deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTeams, createTeam, updateTeam, deleteTeam };