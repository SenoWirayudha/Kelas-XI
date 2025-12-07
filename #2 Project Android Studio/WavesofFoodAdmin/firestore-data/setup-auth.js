const admin = require('firebase-admin');

console.log('🔐 SETUP FIREBASE AUTHENTICATION USER');
console.log('=====================================');

// Initialize Firebase
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

async function createAuthUser() {
  try {
    const email = 'admin@wavesoffood.com';
    const password = 'admin123456';
    
    console.log('📧 Creating Authentication user...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log('✅ User already exists!');
      console.log(`   UID: ${existingUser.uid}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Email Verified: ${existingUser.emailVerified}`);
      
      return existingUser;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('👤 User not found, creating new user...');
        
        // Create new user
        const userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: 'Admin Waves of Food',
          emailVerified: true
        });
        
        console.log('✅ User created successfully!');
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email: ${userRecord.email}`);
        
        return userRecord;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    throw error;
  }
}

async function verifyAdminCollection() {
  try {
    console.log('');
    console.log('🔍 Verifying admin collection...');
    
    const db = admin.firestore();
    const adminsSnapshot = await db.collection('admins').get();
    
    if (adminsSnapshot.empty) {
      console.log('❌ Admin collection is empty!');
      return false;
    }
    
    console.log(`✅ Found ${adminsSnapshot.size} admin(s) in collection`);
    
    adminsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   📄 ${doc.id}: ${data.email} (${data.role})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying admin collection:', error.message);
    return false;
  }
}

async function main() {
  try {
    // Step 1: Create Authentication user
    const user = await createAuthUser();
    
    // Step 2: Verify admin collection
    const hasAdmins = await verifyAdminCollection();
    
    if (!hasAdmins) {
      console.log('');
      console.log('⚠️  Admin collection is empty!');
      console.log('Run: node import-with-key.js');
      return;
    }
    
    console.log('');
    console.log('🎉 SETUP COMPLETE!');
    console.log('==================');
    console.log('✅ Authentication user created/verified');
    console.log('✅ Admin collection verified');
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('=====================');
    console.log('Email: admin@wavesoffood.com');
    console.log('Password: admin123456');
    console.log('');
    console.log('📱 Test login di aplikasi Android sekarang!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

main();
