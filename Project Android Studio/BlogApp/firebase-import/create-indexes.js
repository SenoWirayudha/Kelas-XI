const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Function to create indexes programmatically
async function createFirestoreIndexes() {
  try {
    console.log('🔄 Creating Firestore composite indexes...');
    console.log(`📁 Project: ${serviceAccount.project_id}`);
    console.log('');

    const db = admin.firestore();

    // Required indexes based on error message
    const requiredIndexes = [
      {
        name: 'savedBy_createdAt_index',
        description: 'Index for saved posts query (savedBy array + createdAt)',
        collection: 'posts',
        fields: ['savedBy', 'createdAt']
      },
      {
        name: 'likedBy_createdAt_index', 
        description: 'Index for liked posts query (likedBy array + createdAt)',
        collection: 'posts',
        fields: ['likedBy', 'createdAt']
      },
      {
        name: 'authorId_createdAt_index',
        description: 'Index for author posts query (authorId + createdAt)',
        collection: 'posts', 
        fields: ['authorId', 'createdAt']
      }
    ];

    console.log('📋 Required Composite Indexes:');
    requiredIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}`);
      console.log(`   Collection: ${index.collection}`);
      console.log(`   Fields: ${index.fields.join(', ')}`);
      console.log(`   Purpose: ${index.description}`);
      console.log('');
    });

    // The error URL from the crash log
    const indexCreationUrl = `https://console.firebase.google.com/v1/r/project/blog-app-ee78d/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9ibG9nLWFwcC1lZTc4ZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcG9zdHMvaW5kZXhlcy9fEAEaCwoHc2F2ZWRCeRgBGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI`;

    console.log('🎯 SOLUTION: Create Missing Index');
    console.log('');
    console.log('Option 1 - Direct Link (Recommended):');
    console.log(`Click this link to create the exact index needed:`);
    console.log(indexCreationUrl);
    console.log('');
    console.log('Option 2 - Manual Creation:');
    console.log('1. Open: https://console.firebase.google.com/project/blog-app-ee78d/firestore/indexes');
    console.log('2. Click "Create Index"');
    console.log('3. Collection: posts');
    console.log('4. Add fields:');
    console.log('   - savedBy (Array)');
    console.log('   - createdAt (Descending)');
    console.log('5. Click "Create Index"');
    console.log('');

    // Test simple queries to verify basic functionality
    console.log('🔄 Testing basic Firestore operations...');
    
    try {
      const postsSnapshot = await db.collection('posts').limit(1).get();
      console.log(`✅ Basic posts query working (${postsSnapshot.size} posts found)`);
      
      // Test problematic query (this will fail until index is created)
      console.log('🔄 Testing saved posts query...');
      try {
        const savedQuery = db.collection('posts')
          .where('savedBy', 'array-contains', 'user_1')
          .orderBy('createdAt', 'desc')
          .limit(1);
        
        const savedSnapshot = await savedQuery.get();
        console.log('✅ Saved posts query working!');
        
      } catch (queryError) {
        if (queryError.message.includes('requires an index')) {
          console.log('⚠️  Saved posts query needs index (expected)');
          console.log('   This will work after creating the index above');
        } else {
          console.log('❌ Unexpected query error:', queryError.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Basic Firestore operations failed:', error.message);
    }

    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Click the index creation link above');
    console.log('2. Wait 2-5 minutes for index creation');
    console.log('3. Test the app again');
    console.log('');
    console.log('💡 Alternative - Use Firebase CLI:');
    console.log('1. npm install -g firebase-tools');
    console.log('2. firebase login');
    console.log('3. firebase deploy --only firestore:indexes');

    return true;

  } catch (error) {
    console.error('❌ Index creation preparation failed:', error.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('🔧 Firestore Index Management');
    console.log('='.repeat(60));
    
    await createFirestoreIndexes();
    
  } catch (error) {
    console.error('❌ Index management failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run
main();
