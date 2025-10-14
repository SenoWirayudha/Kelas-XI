const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkData() {
  try {
    console.log('Checking Firestore data...');
    
    // Check posts
    const postsSnapshot = await db.collection('posts').get();
    console.log(`Found ${postsSnapshot.size} posts:`);
    
    postsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- Post ID: ${doc.id}`);
      console.log(`  User: ${data.userName}`);
      console.log(`  Description: ${data.description}`);
      console.log(`  Likes: ${data.likes}`);
      console.log(`  Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      console.log('---');
    });
    
    // Check users
    const usersSnapshot = await db.collection('users').get();
    console.log(`\nFound ${usersSnapshot.size} users:`);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- User ID: ${doc.id}`);
      console.log(`  Full Name: ${data.fullName}`);
      console.log(`  Username: ${data.username}`);
      console.log(`  Email: ${data.email}`);
      console.log('---');
    });
    
    // Check stories
    const storiesSnapshot = await db.collection('stories').get();
    console.log(`\nFound ${storiesSnapshot.size} stories:`);
    
    storiesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- Story ID: ${doc.id}`);
      console.log(`  User: ${data.userName} (${data.userId})`);
      console.log(`  Text: ${data.text || 'No text'}`);
      console.log(`  Image: ${data.imageUrl || data.storyImageUrl}`);
      console.log(`  Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      console.log(`  Viewed: ${data.isViewed}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData();
