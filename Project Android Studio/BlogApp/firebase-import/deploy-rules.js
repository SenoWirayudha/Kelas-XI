const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Function to deploy production security rules
async function deploySecurityRules() {
  try {
    console.log('🔒 Deploying Production Security Rules...');
    console.log(`📁 Project: ${serviceAccount.project_id}`);
    console.log('');

    // Read the production rules file
    const rulesPath = path.join('..', 'firestore.rules');
    
    if (!fs.existsSync(rulesPath)) {
      console.log('❌ firestore.rules file not found!');
      console.log('📁 Expected location: ../firestore.rules');
      return false;
    }

    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('📋 Production Rules to Deploy:');
    console.log('-'.repeat(50));
    console.log(rules);
    console.log('-'.repeat(50));
    console.log('');

    // Note: Firebase Admin SDK doesn't directly support rules deployment
    // This would require Firebase CLI or REST API with additional permissions
    console.log('⚠️  Security Rules Deployment Info:');
    console.log('');
    console.log('🔧 Manual Deployment (Recommended):');
    console.log('1. Install Firebase CLI: npm install -g firebase-tools');
    console.log('2. Login: firebase login');
    console.log('3. Init project: firebase init firestore');
    console.log('4. Deploy rules: firebase deploy --only firestore:rules');
    console.log('');
    console.log('🌐 Console Deployment (Alternative):');
    console.log('1. Open: https://console.firebase.google.com/project/blog-app-ee78d/firestore/rules');
    console.log('2. Copy rules from firestore.rules file');
    console.log('3. Paste and publish');
    console.log('');

    // Test current rules by attempting operations
    console.log('🔄 Testing current database access...');
    
    const db = admin.firestore();
    
    try {
      // Test read access
      const usersSnapshot = await db.collection('users').limit(1).get();
      console.log('✅ Read access working');
      
      // Test write access
      const testDoc = db.collection('_rules_test').doc('test');
      await testDoc.set({
        message: 'Testing write access',
        timestamp: admin.firestore.Timestamp.now()
      });
      console.log('✅ Write access working');
      
      // Clean up
      await testDoc.delete();
      
      console.log('');
      console.log('📊 Current Rules Status:');
      console.log('   🟡 Test Mode Active (allows all access)');
      console.log('   📝 Production rules ready for deployment');
      console.log('   🎯 Recommended: Deploy secure rules before production');
      
    } catch (error) {
      console.log('❌ Database access test failed:', error.message);
    }

    return true;

  } catch (error) {
    console.error('❌ Rules deployment preparation failed:', error.message);
    return false;
  }
}

// Function to show rules comparison
function showRulesComparison() {
  console.log('');
  console.log('📊 Security Rules Comparison:');
  console.log('');
  console.log('🟡 CURRENT (Test Mode):');
  console.log('   allow read, write: if true; // Allows all access');
  console.log('');
  console.log('🟢 PRODUCTION (Secure):');
  console.log('   • Users can only edit their own profile');
  console.log('   • Users can read other profiles (for author info)');
  console.log('   • Posts can be read by authenticated users');
  console.log('   • Posts can only be created/edited by author');
  console.log('   • Anyone can update likes/saves on posts');
  console.log('   • Only authenticated users have access');
  console.log('');
}

// Main function
async function main() {
  try {
    console.log('🔒 Firebase Security Rules Management');
    console.log('='.repeat(60));
    
    const success = await deploySecurityRules();
    
    if (success) {
      showRulesComparison();
      
      console.log('🎯 Next Steps:');
      console.log('');
      console.log('For Development:');
      console.log('   ✅ Current test mode is fine');
      console.log('   🚀 Continue with: npm run import');
      console.log('');
      console.log('For Production:');
      console.log('   1. Install Firebase CLI: npm install -g firebase-tools');
      console.log('   2. Deploy rules: firebase deploy --only firestore:rules');
      console.log('   3. Test with actual user authentication');
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Rules management failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run
main();
