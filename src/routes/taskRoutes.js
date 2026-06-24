const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  bulkCreateTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllTasks);
router.post('/', protect, createTask);
router.post('/bulk', protect, bulkCreateTasks);
router.put('/:id', protect, updateTask);
router.put('/:id/status', protect, updateTaskStatus);
router.delete('/:id', protect, deleteTask);

module.exports = router;