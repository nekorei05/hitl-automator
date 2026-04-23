const Profile = require('../models/Profile');

async function getProfile(userId = null) {
  try {
    const query = userId ? { userId } : {};
    const profile = await Profile.findOne(query);
    return profile ? profile.toJSON() : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

module.exports = getProfile;
