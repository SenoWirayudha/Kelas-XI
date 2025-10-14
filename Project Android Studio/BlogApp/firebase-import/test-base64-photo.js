const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function testBase64Photo() {
  try {
    console.log('🔍 Testing photo base64 data...');
    
    // Get the specific user
    const userId = 'VRNUv3xmWAcYZbuaQkzXCqncBF43'; // cobalagi user ID
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ User document not found');
      return;
    }
    
    const userData = userDoc.data();
    console.log(`✅ User found: ${userData.displayName} (${userData.email})`);
    
    if (userData.profileImageBase64) {
      const base64Data = userData.profileImageBase64;
      console.log(`📸 Profile image data:`);
      console.log(`   Length: ${base64Data.length} characters`);
      console.log(`   Preview: ${base64Data.substring(0, 100)}...`);
      
      // Check if it's a valid base64 image
      if (base64Data.startsWith('/9j/') || base64Data.startsWith('iVBORw0KGgo') || base64Data.startsWith('R0lGOD')) {
        console.log('✅ Base64 appears to be a valid image format');
        
        // Test if it can be decoded
        try {
          const buffer = Buffer.from(base64Data, 'base64');
          console.log(`✅ Base64 decode successful, buffer size: ${buffer.length} bytes`);
          
          // Check image format
          const firstBytes = buffer.slice(0, 10);
          console.log(`🔍 First bytes (hex): ${firstBytes.toString('hex')}`);
          
          if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) {
            console.log('✅ Detected JPEG format');
          } else if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50) {
            console.log('✅ Detected PNG format');
          } else {
            console.log('⚠️  Unknown image format');
          }
          
        } catch (decodeError) {
          console.log('❌ Base64 decode failed:', decodeError.message);
        }
      } else {
        console.log('❌ Base64 does not appear to be a valid image format');
      }
    } else {
      console.log('❌ No profile image base64 data found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testBase64Photo()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
