const mongoose = require('mongoose');
const aiCore = require('./src/services/aiCoreService');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  
  try {
    const profile = await aiCore.getUserProfile(null);
    console.log("Profile fetched:", profile ? "YES" : "NO");

    const analysis = await aiCore.generateMatchAnalysis(
      "Looking for a full-stack developer with React and Node.js experience.",
      profile
    );
    console.log("Analysis Output:", analysis);
    
  } catch (err) {
    console.error("Error in test:", err);
  } finally {
    process.exit(0);
  }
}

run();
