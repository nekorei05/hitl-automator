const Profile = require('../models/Profile');

async function getProfile(userId = null) {
  try {
    const query = userId ? { userId } : {};
    const profile = await Profile.findOne(query);
    if (!profile) {
      return { name: "User", skills: [], projects: [], experience: "" };
    }
    return profile.toJSON();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

module.exports = getProfile;
