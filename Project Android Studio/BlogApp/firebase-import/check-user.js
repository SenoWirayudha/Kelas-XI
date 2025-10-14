const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function checkUser() {
  try {
    const userId = 'VRNUv3xmWAcYZbuaQkzXCqncBF43'; // User yang baru register
    
    console.log('🔍 Checking user document...');
    console.log(`User ID: ${userId}`);
    
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      console.log('✅ User document found!');
      console.log('📄 Document data:');
      console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log('❌ User document not found');
      
      // Check if it exists in a different format
      const allUsers = await firestore.collection('users').get();
      console.log('\n📊 All users in Firestore:');
      allUsers.docs.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id} | Email: ${data.email} | Name: ${data.displayName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkUser()
  .then(() => {
    console.log('\nCheck completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });
