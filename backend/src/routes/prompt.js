const express = require('express');
const router = express.Router();

// POST /api/prompt

router.post('/', async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'jobDescription is required' });
    }

    const { processPrompt } = require('../services/geminiService');
    const aiResult = await processPrompt(jobDescription);

    return res.status(200).json({
      task: aiResult.task || null,
      text: aiResult.text || '',
    });

  } catch (err) {
    console.error('[POST /prompt] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;