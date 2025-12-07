const admin = require('firebase-admin');

console.log('🔍 Verifikasi Import Collection Admins');
console.log('=====================================');

// Initialize Firebase
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyAdmins() {
  try {
    console.log('📋 Mengecek collection admins...');
    
    // Get all documents in admins collection
    const adminsSnapshot = await db.collection('admins').get();
    
    if (adminsSnapshot.empty) {
      console.log('❌ Collection admins kosong atau tidak ada');
      console.log('');
      console.log('💡 Silakan jalankan script import lagi:');
      console.log('node import-with-key.js');
      return;
    }
    
    console.log(`✅ Ditemukan ${adminsSnapshot.size} admin(s)`);
    console.log('');
    
    adminsSnapshot.forEach(doc => {
      console.log(`📄 Document ID: ${doc.id}`);
      const data = doc.data();
      console.log(`   Email: ${data.email}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Active: ${data.isActive}`);
      console.log(`   Created: ${data.createdAt?.toDate()}`);
      console.log('   Permissions:', data.permissions);
      console.log('');
    });
    
    console.log('🎉 COLLECTION ADMINS BERHASIL DIIMPORT!');
    console.log('======================================');
    console.log('');
    console.log('🔑 NEXT STEP: Setup Authentication');
    console.log('==================================');
    console.log('1. Buka Firebase Console → Authentication');
    console.log('2. Tab "Sign-in method" → Enable Email/Password');
    console.log('3. Tab "Users" → Add user:');
    console.log('   Email: admin@wavesoffood.com');
    console.log('   Password: admin123456');
    console.log('');
    console.log('📱 TEST LOGIN:');
    console.log('===============');
    console.log('Email: admin@wavesoffood.com');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('❌ Error verifying admins:', error.message);
  }
}

verifyAdmins();
