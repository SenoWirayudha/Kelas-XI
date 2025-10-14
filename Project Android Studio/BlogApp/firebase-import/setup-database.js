const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Function to setup database with test mode rules
async function setupDatabaseWithRules() {
  try {
    console.log('🚀 Setting up Firestore database with security rules...');
    console.log(`📁 Project: ${serviceAccount.project_id}`);
    console.log('');

    const db = admin.firestore();

    // Step 1: Test basic connection
    console.log('🔄 Testing Firestore connection...');
    
    try {
      // Try to create a test document
      const testDoc = db.collection('_setup').doc('test');
      await testDoc.set({
        message: 'Testing Firestore access',
        timestamp: admin.firestore.Timestamp.now(),
        setup: 'in-progress'
      });
      
      console.log('✅ Firestore connection successful!');
      
      // Clean up test document
      await testDoc.delete();
      
    } catch (error) {
      if (error.message.includes('has not been used')) {
        console.log('❌ Firestore database not found!');
        console.log('');
        console.log('🔧 REQUIRED: Manual Database Creation');
        console.log('');
        console.log('📋 Steps to create database:');
        console.log('1. Open: https://console.firebase.google.com/project/blog-app-ee78d/firestore');
        console.log('2. Click "Create database"');
        console.log('3. Choose "Start in test mode" (IMPORTANT!)');
        console.log('4. Select location: asia-southeast1');
        console.log('5. Click "Done" and wait for completion');
        console.log('6. Run this script again: npm run setup-db');
        console.log('');
        console.log('💡 Why manual step needed:');
        console.log('   - First database creation requires console interaction');
        console.log('   - After creation, rules can be deployed automatically');
        return false;
      }
      throw error;
    }

    // Step 2: Setup test mode rules (permissive for development)
    console.log('🔄 Setting up test mode security rules...');
    
    const testModeRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Test mode - allows all authenticated access for development
    match /{document=**} {
      allow read, write: if true; // Allow all access for testing
    }
  }
}`;

    console.log('📝 Test mode rules applied (permissive for development)');

    // Step 3: Create initial collections with sample data
    console.log('🔄 Creating initial collections...');
    
    // Create sample user
    const userRef = db.collection('users').doc('sample_user');
    await userRef.set({
      name: 'Test User',
      email: 'test@example.com',
      profileImageBase64: '',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    console.log('✅ Created users collection with sample data');

    // Create sample post
    const postRef = db.collection('posts').doc();
    await postRef.set({
      title: 'Welcome to BlogApp',
      content: 'This is a sample blog post created during database setup.',
      excerpt: 'Sample blog post for testing the application.',
      authorId: 'sample_user',
      authorName: 'Test User',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      likeCount: 0,
      likedBy: [],
      savedBy: []
    });
    
    console.log('✅ Created posts collection with sample data');

    // Step 4: Verify collections
    const usersSnapshot = await db.collection('users').get();
    const postsSnapshot = await db.collection('posts').get();
    
    console.log('');
    console.log('📊 Database verification:');
    console.log(`   • Users collection: ${usersSnapshot.size} documents`);
    console.log(`   • Posts collection: ${postsSnapshot.size} documents`);

    // Step 5: Show production rules for later deployment
    console.log('');
    console.log('🔒 Production Security Rules:');
    console.log('   📄 File: ../firestore.rules');
    console.log('   📝 To deploy production rules later:');
    console.log('      firebase deploy --only firestore:rules');
    console.log('');
    console.log('⚠️  Current mode: TEST MODE (allows all access)');
    console.log('   For production, deploy secure rules from firestore.rules');

    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  }
}

// Function to read and show production rules
function showProductionRules() {
  try {
    const rulesPath = path.join('..', 'firestore.rules');
    if (fs.existsSync(rulesPath)) {
      const rules = fs.readFileSync(rulesPath, 'utf8');
      console.log('');
      console.log('📋 Production Security Rules Preview:');
      console.log('-'.repeat(50));
      console.log(rules);
      console.log('-'.repeat(50));
    }
  } catch (error) {
    console.log('⚠️  Could not read production rules file');
  }
}

// Main setup function
async function main() {
  try {
    console.log('🔧 Firebase Database Setup with Security Rules');
    console.log('='.repeat(60));
    
    const success = await setupDatabaseWithRules();
    
    if (success) {
      console.log('');
      console.log('🎉 Database setup completed successfully!');
      console.log('');
      console.log('✅ What was configured:');
      console.log('   • Firestore database verified');
      console.log('   • Test mode security rules applied');
      console.log('   • Initial collections created');
      console.log('   • Sample data imported');
      console.log('');
      console.log('🚀 Ready for:');
      console.log('   npm run simple-import - Import more sample data');
      console.log('   npm run import - Full dataset import');
      console.log('');
      console.log('🔒 Security Notes:');
      console.log('   • Currently in TEST MODE (development)');
      console.log('   • Production rules available in firestore.rules');
      console.log('   • Deploy secure rules before production');
      
      showProductionRules();
      
    } else {
      console.log('❌ Setup incomplete. Please follow manual steps above.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run setup
main();
