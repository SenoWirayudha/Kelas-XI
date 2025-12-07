const admin = require('firebase-admin');

// Initialize Firebase Admin SDK dengan service account file langsung
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Simplified import script yang fokus pada Firestore saja
async function simpleImport() {
  try {
    console.log('🚀 Starting simple data import...');
    console.log(`📁 Project: ${serviceAccount.project_id}`);
    
    // Test basic Firestore write
    const testDoc = db.collection('test').doc('connection-test');
    await testDoc.set({
      message: 'Firebase connection successful!',
      timestamp: admin.firestore.Timestamp.now(),
      version: '1.0.0'
    });
    
    console.log('✅ Firestore connection successful!');
    
    // Import users
    console.log('🔄 Importing users...');
    const usersData = [
      {
        name: 'Ahmad Seno Wirayudha',
        email: 'ahmad.seno@example.com',
        profileImageBase64: '',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      },
      {
        name: 'Budi Santoso',
        email: 'budi.santoso@example.com',
        profileImageBase64: '',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      },
      {
        name: 'Siti Aminah',
        email: 'siti.aminah@example.com',
        profileImageBase64: '',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      }
    ];
    
    // Import users dengan batch
    const usersBatch = db.batch();
    usersData.forEach((userData, index) => {
      const userRef = db.collection('users').doc(`user_${index + 1}`);
      usersBatch.set(userRef, userData);
    });
    await usersBatch.commit();
    console.log(`✅ Imported ${usersData.length} users`);
    
    // Import sample post
    console.log('🔄 Importing sample post...');
    const postData = {
      title: 'Tips Belajar Android Development untuk Pemula',
      content: 'Android development adalah salah satu skill yang sangat dicari di era digital ini. Dalam artikel ini, saya akan membagikan beberapa tips praktis untuk memulai journey sebagai Android developer.',
      excerpt: 'Tips praktis untuk memulai belajar Android development dari nol hingga mahir.',
      authorId: 'user_1',
      authorName: 'Ahmad Seno Wirayudha',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      likeCount: 0,
      likedBy: [],
      savedBy: []
    };
    
    await db.collection('posts').add(postData);
    console.log('✅ Imported 1 sample post');
    
    // Clean up test document
    await testDoc.delete();
    
    // Verify data
    const usersSnapshot = await db.collection('users').get();
    const postsSnapshot = await db.collection('posts').get();
    
    console.log('🎉 Import completed successfully!');
    console.log('📊 Summary:');
    console.log(`   • Users: ${usersSnapshot.size} documents`);
    console.log(`   • Posts: ${postsSnapshot.size} documents`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    
    if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔧 Setup Required:');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Click "Create database" and choose "Start in test mode"');
      console.log('3. Wait a few minutes and try again');
    }
  } finally {
    process.exit(0);
  }
}

// Run simple import
simpleImport();
