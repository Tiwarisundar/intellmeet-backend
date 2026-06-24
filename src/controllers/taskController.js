const Task = require('../models/Task');

// GET /api/tasks
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, meetingId } = req.query;
    const filter = { createdBy: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (meetingId) filter.meetingId = meetingId;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, assigneeName, dueDate, meetingId, isFromAI, tags } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      assigneeName,
      dueDate,
      meetingId,
      isFromAI: isFromAI || false,
      tags: tags || [],
      createdBy: req.user._id,
      status: 'todo'
    });

    res.status(201).json({ success: true, message: 'Task created!', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task updated!', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Task deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks/bulk — AI se aaye tasks bulk create karo
const bulkCreateTasks = async (req, res) => {
  try {
    const { tasks, meetingId } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ success: false, message: 'Tasks array required' });
    }

    const taskDocs = tasks.map(t => ({
      title: t.task || t.title,
      assigneeName: t.owner || t.assigneeName || 'Unassigned',
      priority: t.priority || 'medium',
      dueDate: t.deadline,
      meetingId,
      isFromAI: true,
      createdBy: req.user._id,
      status: 'todo'
    }));

    const created = await Task.insertMany(taskDocs);
    res.status(201).json({ success: true, count: created.length, tasks: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTasks, createTask, updateTask, updateTaskStatus, deleteTask, bulkCreateTasks };