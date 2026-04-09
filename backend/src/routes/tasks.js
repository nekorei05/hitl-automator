const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const taskWorker = require('../workers/taskWorker');
const { generateEmail, generateMatchAnalysis } = require('../services/aiService');
const { sendEmail } = require('../services/emailService');

const TYPE_RULES = [
  { type: 'email', keywords: ['email', 'mail', 'send message', 'outreach', 'smtp'] },
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
    const type = inferType(trimmed);

    // Generate match analysis
    let matchAnalysis = null;
    try {
      matchAnalysis = await generateMatchAnalysis(trimmed);
    } catch (aiError) {
      console.error('[POST /tasks] AI match analysis failed:', aiError);
      matchAnalysis = {
        level: 'MEDIUM',
        score: 50,
        reason: 'Unable to analyze match at this time',
        missing: ['Analysis unavailable'],
        strength: ['Basic skills'],
        insight: 'Please review manually',
        suggestions: ['Review job requirements manually']
      };
    }

    const task = await Task.create({
      jobDescription: trimmed,
      type,
      status: 'CREATED',
      originalPrompt: trimmed,
      matchLevel: matchAnalysis.level,
      matchScore: matchAnalysis.score,
      matchReason: matchAnalysis.reason,
      missingSkills: matchAnalysis.missing,
      strengthSkills: matchAnalysis.strength,
      matchInsight: matchAnalysis.insight,
      suggestions: matchAnalysis.suggestions,
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

    // Simply mark the task as completed in the database
    task.status = 'COMPLETED';
    task.approvedAt = new Date();
    task.completedAt = new Date();
    
    await task.save();

    // Send the success response back to the frontend
    res.json(task);

  } catch (err) {
    console.error('[POST /tasks/:id/approve]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//  POST /api/tasks/:id/reject 
router.post('/:id/reject', async (req, res) => {
  try {
const { reason } = req.body || {};
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

// POST /api/tasks/:id/generate-draft
router.post('/:id/generate-draft', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (task.status !== 'CREATED') {
      return res.status(400).json({ error: 'Task must be in CREATED status to generate draft' });
    }
    try {
      const emailText = await generateEmail(task.jobDescription);
      const lines = emailText.trim().split('\n');
      const subject = lines[0].replace(/^Subject:\s*/i, '').trim();
      const body = lines.slice(1).join('\n').trim();
      task.subject = subject;
      task.body = body;
      task.status = 'READY_FOR_REVIEW';
      await task.save();
      res.json(task);
    } catch (aiError) {
      console.error('[POST /tasks/:id/generate-draft] AI generation failed:', aiError);
      task.subject = 'Draft Email';
      task.body = 'AI email generation failed. Please draft manually.';
      task.status = 'READY_FOR_REVIEW';
      await task.save();
      res.json(task);
    }
  } catch (err) {
    console.error('[POST /tasks/:id/generate-draft]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
