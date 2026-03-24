const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// POST /prompt
router.post('/', async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'jobDescription is required' });
    }

    const newTask = new Task({
      type: 'email',
      jobDescription,
      recipient: 'hr@company.com',
      subject: 'Application for Backend Developer Role',
      body: 'Dear HR,\n\nI am writing to express my interest in the Backend Developer position. Please find my details attached.\n\nBest regards,\nApplicant',
      originalPrompt: jobDescription,
      status: 'PENDING_APPROVAL'
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task from prompt:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
