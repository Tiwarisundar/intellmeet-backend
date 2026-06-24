const express = require('express');
const router = express.Router();
const {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllTeams);
router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);

module.exports = router;