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

// Function to test Firestore connection
async function testFirestoreConnection() {
  try {
    console.log('🔄 Testing Firestore connection...');
    
    // Try to read from a collection
    const testCollection = await db.collection('test').limit(1).get();
    console.log('✅ Firestore connection successful!');
    
    return true;
  } catch (error) {
    console.log('❌ Firestore connection failed:', error.message);
    return false;
  }
}

// Function to test Firebase Auth connection
async function testAuthConnection() {
  try {
    console.log('🔄 Testing Firebase Auth connection...');
    
    // Try to list users (even if empty)
    await admin.auth().listUsers(1);
    console.log('✅ Firebase Auth connection successful!');
    
    return true;
  } catch (error) {
    console.log('❌ Firebase Auth connection failed:', error.message);
    return false;
  }
}

// Function to validate environment variables
function validateEnvironment() {
  console.log('🔄 Validating environment variables...');
  
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:');
    missing.forEach(varName => {
      console.log(`   • ${varName}`);
    });
    return false;
  }
  
  console.log('✅ All required environment variables are set!');
  console.log(`📁 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`📧 Service Account: ${process.env.FIREBASE_CLIENT_EMAIL}`);
  
  return true;
}

// Function to check current database state
async function checkDatabaseState() {
  try {
    console.log('🔄 Checking current database state...');
    
    const usersSnapshot = await db.collection('users').get();
    const postsSnapshot = await db.collection('posts').get();
    
    console.log('📊 Current database state:');
    console.log(`   • Users collection: ${usersSnapshot.size} documents`);
    console.log(`   • Posts collection: ${postsSnapshot.size} documents`);
    
    if (usersSnapshot.size > 0) {
      console.log('👥 Sample users:');
      usersSnapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`   • ${data.name} (${data.email})`);
      });
    }
    
    if (postsSnapshot.size > 0) {
      console.log('📝 Sample posts:');
      postsSnapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`   • "${data.title}" by ${data.authorName}`);
      });
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error checking database state:', error.message);
    return false;
  }
}

// Function to validate Firestore security rules
async function validateSecurityRules() {
  try {
    console.log('🔄 Validating Firestore security rules...');
    
    // Try to create a test document (this will fail if rules are too restrictive)
    const testDoc = db.collection('test').doc('validation-test');
    await testDoc.set({ 
      timestamp: admin.firestore.Timestamp.now(),
      test: true 
    });
    
    // Try to read it back
    const doc = await testDoc.get();
    if (doc.exists) {
      console.log('✅ Security rules allow admin operations');
    }
    
    // Clean up
    await testDoc.delete();
    
    return true;
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log('⚠️ Security rules might be too restrictive for admin operations');
      console.log('   Make sure your service account has proper permissions');
    } else {
      console.log('❌ Error validating security rules:', error.message);
    }
    return false;
  }
}

// Main validation function
async function runValidation() {
  try {
    console.log('🚀 Starting Firebase configuration validation...');
    console.log('='.repeat(50));
    
    // Step 1: Validate environment variables
    if (!validateEnvironment()) {
      console.log('\n❌ Environment validation failed!');
      console.log('📝 Please check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    
    console.log('');
    
    // Step 2: Test connections
    const firestoreOk = await testFirestoreConnection();
    const authOk = await testAuthConnection();
    
    console.log('');
    
    // Step 3: Check database state
    if (firestoreOk) {
      await checkDatabaseState();
    }
    
    console.log('');
    
    // Step 4: Validate security rules
    if (firestoreOk) {
      await validateSecurityRules();
    }
    
    console.log('');
    console.log('='.repeat(50));
    
    if (firestoreOk && authOk) {
      console.log('🎉 All validations passed!');
      console.log('✅ Your Firebase configuration is working correctly.');
      console.log('');
      console.log('🚀 You can now run:');
      console.log('   • npm run import - to import sample data');
      console.log('   • npm run clear - to clear all data');
    } else {
      console.log('❌ Some validations failed!');
      console.log('📝 Please check your Firebase configuration and try again.');
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the validation
runValidation();
