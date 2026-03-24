const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const mockSend = require('../services/mockSend');

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/approve/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await mockSend(task);

    task.status = 'COMPLETED';
    task.completedAt = new Date();

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error('Error approving task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
