const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Function to force initialize Firestore
async function forceInitializeFirestore() {
  try {
    console.log('🚀 Attempting to force-initialize Firestore...');
    console.log(`📁 Project: ${serviceAccount.project_id}`);
    console.log('');
    
    const db = admin.firestore();
    
    // Method 1: Try to create initial document
    console.log('🔄 Method 1: Creating initial document...');
    try {
      const initDoc = db.collection('_init').doc('setup');
      await initDoc.set({
        message: 'Firestore initialized successfully',
        timestamp: admin.firestore.Timestamp.now(),
        method: 'auto-initialization'
      });
      
      console.log('✅ Success! Firestore is now initialized and accessible');
      
      // Clean up
      await initDoc.delete();
      
      return true;
    } catch (error) {
      console.log('❌ Method 1 failed:', error.message);
      
      if (error.message.includes('has not been used')) {
        console.log('');
        console.log('🎯 SOLUTION: Manual Firestore Database Creation Required');
        console.log('');
        console.log('🔧 Quick Manual Steps:');
        console.log('1. Open: https://console.firebase.google.com/project/blog-app-ee78d/firestore');
        console.log('2. Click "Create database"');
        console.log('3. Choose "Start in test mode"');
        console.log('4. Select location: asia-southeast1');
        console.log('5. Click "Done"');
        console.log('6. Wait 1-2 minutes');
        console.log('7. Run: npm run simple-import');
        console.log('');
        console.log('💡 Why manual step needed:');
        console.log('   - First-time Firestore creation requires console interaction');
        console.log('   - After creation, all operations can be done programmatically');
        console.log('   - This is a one-time Google Cloud requirement');
        
        return false;
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Force initialization failed:', error.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    const success = await forceInitializeFirestore();
    
    if (success) {
      console.log('');
      console.log('🎉 Firestore is ready!');
      console.log('🚀 You can now run:');
      console.log('   npm run simple-import');
      console.log('   npm run import');
    } else {
      console.log('');
      console.log('📋 Next action: Complete manual setup, then run npm run simple-import');
    }
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run
main();
