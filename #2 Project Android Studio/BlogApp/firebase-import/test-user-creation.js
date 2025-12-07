const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

async function testUserCreation() {
  try {
    console.log('🧪 Testing user creation process...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testDisplayName = 'Test User';
    
    console.log(`📝 Creating test user: ${testEmail}`);
    
    // Step 1: Create Auth user
    const userRecord = await auth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: testDisplayName
    });
    
    console.log(`✅ Auth user created: ${userRecord.uid}`);
    
    // Step 2: Create Firestore document
    const userDoc = {
      id: userRecord.uid,
      email: testEmail,
      displayName: testDisplayName,
      profileImageUrl: '',
      profileImageBase64: '',
      createdAt: new Date()
    };
    
    await firestore.collection('users').doc(userRecord.uid).set(userDoc);
    console.log(`✅ Firestore document created`);
    
    // Step 3: Verify document exists
    const doc = await firestore.collection('users').doc(userRecord.uid).get();
    if (doc.exists) {
      console.log(`✅ Document verified: ${JSON.stringify(doc.data())}`);
    } else {
      console.log(`❌ Document not found`);
    }
    
    // Step 4: Clean up test user
    await auth.deleteUser(userRecord.uid);
    await firestore.collection('users').doc(userRecord.uid).delete();
    console.log(`🧹 Test user cleaned up`);
    
    console.log('🎉 Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserCreation()
  .then(() => {
    console.log('Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
