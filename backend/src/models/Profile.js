const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false, 
    index: true 
  },
  name: { type: String, required: true },
  skills: [{ type: String }],
  projects: [{ type: String }],
  experience: { type: String }
});

module.exports = mongoose.model('Profile', ProfileSchema);
