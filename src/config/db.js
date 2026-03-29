const mongoose = require('mongoose');
const Profile = require('../models/Profile');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default profile if none exists
    const profileCount = await Profile.countDocuments();
    if (profileCount === 0) {
      await Profile.create({
        name: "Rei",
        skills: ["Node.js", "MongoDB", "Express", "React"],
        projects: ["MEWse music app", "AI Quiz App"],
        experience: "Backend and full-stack development"
      });
      console.log('Seeded default user profile.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;