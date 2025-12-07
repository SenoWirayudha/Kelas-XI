const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function monitorUserAccess() {
  try {
    const userId = 'VRNUv3xmWAcYZbuaQkzXCqncBF43'; // User yang baru register
    
    console.log('📊 Monitoring user data access...');
    console.log(`User ID: ${userId}`);
    console.log('This will show if the document is being accessed\n');
    
    // Monitor document reads (this is indirect, but we can check last access patterns)
    let checkCount = 0;
    const maxChecks = 20;
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      try {
        const startTime = Date.now();
        const doc = await firestore.collection('users').doc(userId).get();
        const fetchTime = Date.now() - startTime;
        
        console.log(`Check ${checkCount}/${maxChecks}: Document exists: ${doc.exists}, Fetch time: ${fetchTime}ms`);
        
        if (doc.exists) {
          const data = doc.data();
          console.log(`   ↳ DisplayName: ${data.displayName}, Email: ${data.email}`);
        }
        
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          console.log('\n✅ Monitoring completed');
          
          // Final verification
          console.log('\n🔍 Final verification:');
          const finalDoc = await firestore.collection('users').doc(userId).get();
          if (finalDoc.exists()) {
            console.log('✅ User document is accessible');
            console.log('📄 Final data:', JSON.stringify(finalDoc.data(), null, 2));
          } else {
            console.log('❌ User document not accessible');
          }
          
          process.exit(0);
        }
        
      } catch (error) {
        console.error(`❌ Error on check ${checkCount}:`, error.message);
      }
      
    }, 2000); // Check every 2 seconds
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

// Run the monitor
console.log('🚀 Starting user access monitor...');
console.log('Press Ctrl+C to stop early\n');

monitorUserAccess().catch(console.error);

process.on('SIGINT', () => {
  console.log('\n🛑 Monitor stopped by user');
  process.exit(0);
});
