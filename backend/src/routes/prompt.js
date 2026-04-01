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

    const processPrompt = require('../services/geminiService').processPrompt;
    const aiResult = await processPrompt(jobDescription);

    if (aiResult.task) {
      return res.status(201).json(aiResult.task);
    } else {
      return res.status(200).json({ message: aiResult.text });
    }
  } catch (err) {
    console.error(" ERROR IN /prompt:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
