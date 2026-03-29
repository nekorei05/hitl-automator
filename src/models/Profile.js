const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  skills: [{ type: String }],
  projects: [{ type: String }],
  experience: { type: String }
});

module.exports = mongoose.model('Profile', ProfileSchema);
