const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

async function fixMissingUsers() {
  try {
    console.log('🔍 Checking for missing user documents...');
    
    // Get all users from Authentication
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;
    console.log(`Found ${authUsers.length} users in Authentication`);
    
    // Get all user documents from Firestore
    const usersSnapshot = await firestore.collection('users').get();
    const firestoreUserIds = new Set();
    usersSnapshot.docs.forEach(doc => {
      firestoreUserIds.add(doc.id);
    });
    console.log(`Found ${firestoreUserIds.size} user documents in Firestore`);
    
    // Find missing users
    const missingUsers = authUsers.filter(user => !firestoreUserIds.has(user.uid));
    console.log(`Found ${missingUsers.length} missing user documents`);
    
    if (missingUsers.length === 0) {
      console.log('✅ All users have corresponding Firestore documents');
      return;
    }
    
    // Create missing user documents
    for (const user of missingUsers) {
      try {
        console.log(`📝 Creating document for user: ${user.email} (${user.uid})`);
        
        const userDoc = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          profileImageUrl: '',
          profileImageBase64: '',
          createdAt: new Date(user.metadata.creationTime)
        };
        
        await firestore.collection('users').doc(user.uid).set(userDoc);
        console.log(`✅ Created document for ${user.email}`);
        
      } catch (error) {
        console.error(`❌ Failed to create document for ${user.email}:`, error);
      }
    }
    
    console.log('🎉 Finished fixing missing user documents');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
fixMissingUsers()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
