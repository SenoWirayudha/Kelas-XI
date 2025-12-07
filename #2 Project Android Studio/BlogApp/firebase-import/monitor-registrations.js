const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function monitorRegistrations() {
  console.log('🔍 Starting registration monitor...');
  console.log('This will watch for new user registrations in real-time');
  console.log('Press Ctrl+C to stop monitoring\n');
  
  let lastCount = 0;
  
  // Get initial count
  const initialSnapshot = await firestore.collection('users').get();
  lastCount = initialSnapshot.size;
  console.log(`📊 Current user count: ${lastCount}\n`);
  
  // Monitor changes
  const unsubscribe = firestore.collection('users').onSnapshot(snapshot => {
    const currentCount = snapshot.size;
    
    if (currentCount > lastCount) {
      console.log(`🎉 NEW USER REGISTERED! Count: ${lastCount} → ${currentCount}`);
      
      // Show details of new users
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const now = new Date();
        const timeDiff = now - createdAt;
        
        // If created within last 30 seconds, it's probably new
        if (timeDiff < 30000) {
          console.log(`📝 New user details:`);
          console.log(`   ID: ${doc.id}`);
          console.log(`   Email: ${data.email}`);
          console.log(`   Display Name: ${data.displayName}`);
          console.log(`   Created: ${createdAt.toLocaleString()}`);
          console.log('');
        }
      });
      
      lastCount = currentCount;
    } else if (currentCount < lastCount) {
      console.log(`❌ User deleted. Count: ${lastCount} → ${currentCount}`);
      lastCount = currentCount;
    }
  }, error => {
    console.error('❌ Error monitoring users:', error);
  });
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping monitor...');
    unsubscribe();
    process.exit(0);
  });
}

// Run the monitor
monitorRegistrations().catch(console.error);
