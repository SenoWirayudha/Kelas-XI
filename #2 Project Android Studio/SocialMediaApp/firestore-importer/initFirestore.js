const { db } = require('./firebase-config');

async function initializeFirestore() {
  try {
    console.log('🔄 Initializing Firestore database...');
    
    // Try to create a simple test document to initialize the database
    await db.collection('_init').doc('test').set({
      initialized: true,
      timestamp: Date.now()
    });
    
    console.log('✅ Firestore database initialized successfully!');
    
    // Clean up test document
    await db.collection('_init').doc('test').delete();
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/social-media-app-ad35e/firestore');
    console.log('2. Click "Create database" for Cloud Firestore');
    console.log('3. Choose "Start in test mode" for now');
    console.log('4. Select a location (recommend: us-central1)');
    console.log('5. Wait for database creation to complete');
    console.log('6. Then run the import command again');
    
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  initializeFirestore().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { initializeFirestore };
