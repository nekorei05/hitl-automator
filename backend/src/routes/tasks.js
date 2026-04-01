const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const taskWorker = require('../workers/taskWorker');

const TYPE_RULES = [
  { type: 'email',   keywords: ['email', 'mail', 'send message', 'outreach', 'smtp'] },
  { type: 'invoice', keywords: ['invoice', 'bill', 'payment', 'charge', 'receipt'] },
];

function inferType(input) {
  const lower = input.toLowerCase();
  for (const rule of TYPE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.type;
  }
  return 'email'; 
}
// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('[GET /tasks]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tasks 
router.post('/', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || !input.trim()) {
      return res.status(400).json({ error: 'input is required' });
    }

    const trimmed = input.trim();

    const task = await Task.create({
      jobDescription: trimmed,         
      type: inferType(trimmed),        
      status: 'PENDING_APPROVAL',
      originalPrompt: trimmed,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('[POST /tasks]', err);
    if (err.name === 'ValidationError') {
      return res.status(422).json({ error: 'Validation failed', details: err.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tasks/:id/approve 
router.post('/:id/approve', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'APPROVED';
    task.approvedAt = new Date();
    await task.save();

    // Hand off to worker — runs async, doesn't block the HTTP response
    taskWorker.run(task).catch((err) =>
      console.error(`[Worker] Failed for task ${task._id}:`, err)
    );

    res.json(task);
  } catch (err) {
    console.error('[POST /tasks/:id/approve]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//  POST /api/tasks/:id/reject 
router.post('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body; // optional rejection reason from frontend

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'REJECTED';
    if (reason) task.rejectionReason = reason;
    await task.save();

    res.json(task);
  } catch (err) {
    console.error('[POST /tasks/:id/reject]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
