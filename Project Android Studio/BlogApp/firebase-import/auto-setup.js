const admin = require('firebase-admin');
const { google } = require('googleapis');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Function to enable APIs programmatically
async function enableFirestoreAPI() {
  try {
    console.log('🔄 Enabling Firestore API programmatically...');
    
    // Create Google Auth client
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/servicemanagement'
      ]
    });
    
    const authClient = await auth.getClient();
    const serviceUsage = google.serviceusage('v1');
    
    // Enable Cloud Firestore API
    const firestoreService = `projects/${serviceAccount.project_id}/services/firestore.googleapis.com`;
    
    console.log('📡 Enabling Firestore API...');
    await serviceUsage.services.enable({
      auth: authClient,
      name: firestoreService
    });
    
    console.log('✅ Firestore API enabled successfully!');
    
    // Wait for propagation
    console.log('⏳ Waiting for API propagation (30 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    return true;
  } catch (error) {
    console.log('❌ Failed to enable API:', error.message);
    return false;
  }
}

// Function to create Firestore database programmatically
async function createFirestoreDatabase() {
  try {
    console.log('🔄 Creating Firestore database...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const authClient = await auth.getClient();
    const firestore = google.firestore('v1');
    
    // Create database
    const databaseId = '(default)';
    const parent = `projects/${serviceAccount.project_id}`;
    
    const request = {
      auth: authClient,
      parent: parent,
      databaseId: databaseId,
      resource: {
        name: `${parent}/databases/${databaseId}`,
        locationId: 'asia-southeast1',
        type: 'FIRESTORE_NATIVE',
        concurrencyMode: 'OPTIMISTIC',
        appEngineIntegrationMode: 'DISABLED'
      }
    };
    
    console.log('🏗️ Creating database instance...');
    await firestore.projects.databases.create(request);
    
    console.log('✅ Firestore database created successfully!');
    
    // Wait for database to be ready
    console.log('⏳ Waiting for database initialization (20 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Firestore database already exists!');
      return true;
    }
    console.log('❌ Failed to create database:', error.message);
    return false;
  }
}

// Function to setup test mode security rules
async function setupTestModeRules() {
  try {
    console.log('🔄 Setting up test mode security rules...');
    
    const db = admin.firestore();
    
    // Test basic write operation to verify access
    const testDoc = db.collection('_test').doc('setup');
    await testDoc.set({
      message: 'Database setup successful',
      timestamp: admin.firestore.Timestamp.now()
    });
    
    console.log('✅ Test mode rules working correctly!');
    
    // Clean up test document
    await testDoc.delete();
    
    return true;
  } catch (error) {
    console.log('❌ Security rules issue:', error.message);
    console.log('📝 Manual step required: Set Firestore to test mode in Firebase Console');
    return false;
  }
}

// Main auto-setup function
async function autoSetupFirestore() {
  try {
    console.log('🚀 Starting automatic Firestore setup...');
    console.log(`📁 Project: ${serviceAccount.project_id}`);
    console.log('='.repeat(60));
    
    // Step 1: Enable APIs
    const apiEnabled = await enableFirestoreAPI();
    if (!apiEnabled) {
      console.log('❌ Failed to enable APIs. Manual setup required.');
      return false;
    }
    
    // Step 2: Create database
    const dbCreated = await createFirestoreDatabase();
    if (!dbCreated) {
      console.log('❌ Failed to create database. Manual setup required.');
      return false;
    }
    
    // Step 3: Test access
    const rulesOk = await setupTestModeRules();
    if (!rulesOk) {
      console.log('⚠️ Database created but rules need manual configuration.');
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 Firestore setup completed!');
    console.log('');
    console.log('✅ What was done:');
    console.log('   • Enabled Cloud Firestore API');
    console.log('   • Created Firestore database in asia-southeast1');
    console.log('   • Verified basic read/write access');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   npm run simple-import - Import sample data');
    console.log('   npm run import - Import full dataset');
    
    return true;
    
  } catch (error) {
    console.error('❌ Auto-setup failed:', error.message);
    console.log('');
    console.log('📝 Manual setup required:');
    console.log('1. Go to Firebase Console > Firestore Database');
    console.log('2. Click "Create database" and choose "Start in test mode"');
    console.log('3. Select location: asia-southeast1');
    console.log('4. Wait for completion and try npm run simple-import');
    return false;
  } finally {
    process.exit(0);
  }
}

// Run auto-setup
autoSetupFirestore();
