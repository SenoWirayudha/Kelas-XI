const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
// Option 1: Using service account key file (download dari Firebase Console)
// const serviceAccount = require('./service-account-key.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Using default credentials (for development)
try {
  // Try to initialize with default credentials or environment variables
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id'
  });
} catch (error) {
  console.log('⚠️  Using default initialization (for demo purposes)');
  // For demo/testing purposes - you'll need to set your actual project ID
  admin.initializeApp({
    projectId: 'waves-of-food-admin' // Replace with your actual project ID
  });
}

const db = admin.firestore();

// Read the JSON data
const adminsData = JSON.parse(fs.readFileSync('./admins.json', 'utf8'));

async function importAdmins() {
  try {
    console.log('Starting import of admins collection...');
    
    const batch = db.batch();
    
    for (const [adminId, adminData] of Object.entries(adminsData.admins)) {
      const adminRef = db.collection('admins').doc(adminId);
      batch.set(adminRef, {
        ...adminData,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(adminData.createdAt))
      });
      
      console.log(`Added admin: ${adminData.email}`);
    }
    
    await batch.commit();
    console.log('✅ Successfully imported admins collection!');
    
    // Create corresponding Authentication users
    console.log('Creating Authentication users...');
    
    for (const [adminId, adminData] of Object.entries(adminsData.admins)) {
      try {
        const userRecord = await admin.auth().createUser({
          email: adminData.email,
          password: 'admin123456', // Default password - should be changed
          displayName: adminData.name,
          emailVerified: true
        });
        
        console.log(`✅ Created auth user: ${adminData.email}`);
      } catch (error) {
        console.log(`⚠️  Auth user may already exist: ${adminData.email}`);
      }
    }
    
    console.log('🎉 Import completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

importAdmins();
