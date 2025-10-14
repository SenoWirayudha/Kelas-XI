const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Function to clear all users
async function clearUsers() {
  console.log('🗑️ Clearing users collection...');
  const usersSnapshot = await db.collection('users').get();
  
  if (usersSnapshot.empty) {
    console.log('   ⚪ Users collection is already empty');
    return;
  }
  
  const batch = db.batch();
  usersSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`   ✅ Deleted ${usersSnapshot.size} users`);
}

// Function to clear all posts
async function clearPosts() {
  console.log('🗑️ Clearing posts collection...');
  const postsSnapshot = await db.collection('posts').get();
  
  if (postsSnapshot.empty) {
    console.log('   ⚪ Posts collection is already empty');
    return;
  }
  
  const batch = db.batch();
  postsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`   ✅ Deleted ${postsSnapshot.size} posts`);
}

// Function to clear all authentication users
async function clearAuthUsers() {
  console.log('🗑️ Clearing Firebase Authentication users...');
  
  try {
    const listUsersResult = await admin.auth().listUsers();
    
    if (listUsersResult.users.length === 0) {
      console.log('   ⚪ No authentication users found');
      return;
    }
    
    const uids = listUsersResult.users.map(user => user.uid);
    await admin.auth().deleteUsers(uids);
    
    console.log(`   ✅ Deleted ${uids.length} authentication users`);
  } catch (error) {
    console.log('   ⚠️ Could not clear auth users:', error.message);
  }
}

// Main clear function
async function clearAllData() {
  try {
    console.log('🧹 Starting to clear all data from Firestore...');
    console.log(`📁 Project: ${process.env.FIREBASE_PROJECT_ID}`);
    
    // Show current database state
    const usersSnapshot = await db.collection('users').get();
    const postsSnapshot = await db.collection('posts').get();
    
    console.log('📊 Current database state:');
    console.log(`   • Users: ${usersSnapshot.size} documents`);
    console.log(`   • Posts: ${postsSnapshot.size} documents`);
    
    if (usersSnapshot.size === 0 && postsSnapshot.size === 0) {
      console.log('✨ Database is already clean!');
      return;
    }
    
    // Confirm before deletion
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('⚠️ This will delete ALL data. Are you sure? (y/N): ', async (answer) => {
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log('❌ Operation cancelled');
          rl.close();
          resolve();
          return;
        }
        
        await clearUsers();
        await clearPosts();
        await clearAuthUsers();
        
        console.log('🎉 All data cleared successfully!');
        
        // Verify clearing
        const usersAfter = await db.collection('users').get();
        const postsAfter = await db.collection('posts').get();
        
        console.log('📈 Database verification:');
        console.log(`   • Users remaining: ${usersAfter.size} documents`);
        console.log(`   • Posts remaining: ${postsAfter.size} documents`);
        
        rl.close();
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the clear operation
clearAllData();
