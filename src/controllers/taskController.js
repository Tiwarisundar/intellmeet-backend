const Task = require('../models/Task'); // <-- adjust path if your model file is elsewhere

// @desc    Get all tasks (with optional filters: status, priority, meetingId, assignee)
// @route   GET /tasks?status=todo&meetingId=...&assignee=...
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, meetingId, assignee } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (meetingId) filter.meetingId = meetingId;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('meetingId', 'title meetingCode')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (err) {
    console.error('getAllTasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// @desc    Get single task by ID
// @route   GET /tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('meetingId', 'title meetingCode');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, task });
  } catch (err) {
    console.error('getTaskById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

// @desc    Create a new task
// @route   POST /tasks
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignee, assigneeName, meetingId, dueDate, tags, isFromAI } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || undefined,
      assigneeName,
      createdBy: req.user._id, // <-- adjust if your auth middleware sets req.user.id instead
      meetingId: meetingId || undefined,
      dueDate: dueDate || undefined,
      tags: tags || [],
      isFromAI: isFromAI || false
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('meetingId', 'title meetingCode');

    res.status(201).json({ success: true, task: populatedTask });
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// @desc    Update a task (title, description, priority, assignee, dueDate, tags, meetingId etc.)
// @route   PUT /tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'assigneeName', 'dueDate', 'tags', 'meetingId'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('meetingId', 'title meetingCode');

    res.status(200).json({ success: true, task: populatedTask });
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// @desc    Update only the status of a task (used for drag-and-drop / kanban board)
// @route   PUT /tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('meetingId', 'title meetingCode');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, task });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
};

// @desc    Delete a task
// @route   DELETE /tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

// @desc    Bulk create tasks (e.g. from AI meeting summary action items)
// @route   POST /tasks/bulk
const bulkCreateTasks = async (req, res) => {
  try {
    const { tasks, meetingId } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'tasks array is required' });
    }

    const tasksToInsert = tasks.map((t) => ({
      title: t.title,
      description: t.description,
      status: t.status || 'todo',
      priority: t.priority || 'medium',
      assignee: t.assignee || undefined,
      assigneeName: t.assigneeName,
      createdBy: req.user._id, // <-- adjust if your auth middleware sets req.user.id instead
      meetingId: meetingId || t.meetingId || undefined,
      dueDate: t.dueDate || undefined,
      tags: t.tags || [],
      isFromAI: true
    }));

    const createdTasks = await Task.insertMany(tasksToInsert);

    res.status(201).json({ success: true, tasks: createdTasks });
  } catch (err) {
    console.error('bulkCreateTasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk create tasks' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  bulkCreateTasks
};