const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-setup/INSERT KEY HERE'); // Replace with the path to your Firebase credentials JSON file

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Function to set custom claims (admin) for a user
async function setAdminClaim(userId) {
  try {
    await admin.auth().setCustomUserClaims(userId, { admin: true });
    console.log(`Successfully set admin role for user: ${userId}`);
  } catch (error) {
    console.error('Error setting admin claim:', error);
  }
}

// Example usage: Pass the UID of the user to give admin privileges
const userId = 'WBUpxfleBDeBy7kqnIiebXZ0JTv2';  // Replace with the actual user's UID
setAdminClaim(userId);
