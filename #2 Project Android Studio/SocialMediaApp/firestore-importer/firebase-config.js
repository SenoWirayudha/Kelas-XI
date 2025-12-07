const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK using service account file
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'social-media-app-ad35e'}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();

module.exports = { admin, db };
