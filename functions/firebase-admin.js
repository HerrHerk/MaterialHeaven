const admin = require("firebase-admin");

if (!admin.apps.length) { // Check if the app is already initialized
  admin.initializeApp();
}

module.exports = admin;
