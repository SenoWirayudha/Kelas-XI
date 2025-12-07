const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function testUserLoad() {
  try {
    const userId = 'VRNUv3xmWAcYZbuaQkzXCqncBF43'; // User yang baru register
    
    console.log('🧪 Testing user data load like Android app...');
    console.log(`User ID: ${userId}`);
    
    // Simulate what Android AuthRepository.getUserData() does
    const document = await firestore.collection('users').doc(userId).get();
    
    console.log(`Document exists: ${document.exists}`);
    
    if (document.exists) {
      const data = document.data();
      console.log('✅ Raw document data:');
      console.log(JSON.stringify(data, null, 2));
      
      // Try to convert to User object like Android does
      const user = {
        id: data.id || '',
        email: data.email || '',
        displayName: data.displayName || '',
        profileImageUrl: data.profileImageUrl || '',
        profileImageBase64: data.profileImageBase64 || '',
        createdAt: data.createdAt
      };
      
      console.log('\n📱 Converted User object (Android format):');
      console.log(JSON.stringify(user, null, 2));
      
      // Check if all required fields are present
      const requiredFields = ['id', 'email', 'displayName'];
      const missingFields = requiredFields.filter(field => !user[field]);
      
      if (missingFields.length === 0) {
        console.log('\n✅ All required fields present - should work in Android');
      } else {
        console.log(`\n❌ Missing fields: ${missingFields.join(', ')}`);
      }
      
    } else {
      console.log('❌ Document does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testUserLoad()
  .then(() => {
    console.log('\nTest completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
