const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function monitorProfilePhotoUpdates() {
  console.log('📸 Starting profile photo update monitor...');
  console.log('This will watch for profile photo changes in real-time');
  console.log('Press Ctrl+C to stop monitoring\n');
  
  // Monitor specific user's profile photo changes
  const usersCollection = firestore.collection('users');
  
  // Get current state
  const snapshot = await usersCollection.get();
  const currentUsers = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    currentUsers[doc.id] = {
      email: data.email,
      displayName: data.displayName,
      hasPhoto: data.profileImageBase64 && data.profileImageBase64.length > 0,
      photoLength: data.profileImageBase64 ? data.profileImageBase64.length : 0
    };
  });
  
  console.log('📊 Current users with profile photos:');
  Object.entries(currentUsers).forEach(([id, user]) => {
    const photoStatus = user.hasPhoto ? `✅ Has photo (${user.photoLength} chars)` : '❌ No photo';
    console.log(`   ${user.displayName} (${user.email}): ${photoStatus}`);
  });
  console.log('');
  
  // Monitor changes
  const unsubscribe = usersCollection.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'modified') {
        const doc = change.doc;
        const data = doc.data();
        const userId = doc.id;
        const oldUser = currentUsers[userId];
        
        if (oldUser) {
          const newHasPhoto = data.profileImageBase64 && data.profileImageBase64.length > 0;
          const newPhotoLength = data.profileImageBase64 ? data.profileImageBase64.length : 0;
          
          if (oldUser.hasPhoto !== newHasPhoto || oldUser.photoLength !== newPhotoLength) {
            console.log(`📸 PROFILE PHOTO UPDATED!`);
            console.log(`   User: ${data.displayName} (${data.email})`);
            console.log(`   ID: ${userId}`);
            console.log(`   Before: ${oldUser.hasPhoto ? `Photo (${oldUser.photoLength} chars)` : 'No photo'}`);
            console.log(`   After: ${newHasPhoto ? `Photo (${newPhotoLength} chars)` : 'No photo'}`);
            
            if (newHasPhoto && data.profileImageBase64) {
              console.log(`   Base64 preview: ${data.profileImageBase64.substring(0, 50)}...`);
            }
            console.log(`   Timestamp: ${new Date().toLocaleString()}`);
            console.log('');
            
            // Update current state
            currentUsers[userId] = {
              email: data.email,
              displayName: data.displayName,
              hasPhoto: newHasPhoto,
              photoLength: newPhotoLength
            };
          }
        }
      }
    });
  }, error => {
    console.error('❌ Error monitoring profile photos:', error);
  });
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping profile photo monitor...');
    unsubscribe();
    process.exit(0);
  });
}

// Run the monitor
monitorProfilePhotoUpdates().catch(console.error);
