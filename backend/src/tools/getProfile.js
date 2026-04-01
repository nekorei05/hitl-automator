const Profile = require('../models/Profile');

async function getProfile() {
  try {
    const profile = await Profile.findOne();
    return profile ? profile.toJSON() : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

module.exports = getProfile;
