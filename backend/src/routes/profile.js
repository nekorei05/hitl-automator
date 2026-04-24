const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const query = userId ? { userId } : {};

    let profile = await Profile.findOne(query);
    if (!profile) {

      profile = { name: '', experience: '', skills: [], projects: [] };
    }
    res.json(profile);
  } catch (err) {
    console.error('[GET /profile]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/profile
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const query = userId ? { userId } : {};

    const { name, experience, skills, projects } = req.body;


    const parseList = (input) => {
      if (Array.isArray(input)) return input;
      if (typeof input === 'string') {
        return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      return [];
    };

    const updateData = {
      name: name || '',
      experience: experience || '',
      skills: parseList(skills),
      projects: parseList(projects),
    };

    // Upsert the profile
    const profile = await Profile.findOneAndUpdate(
      query,
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(profile);
  } catch (err) {
    console.error('[PUT /profile]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
