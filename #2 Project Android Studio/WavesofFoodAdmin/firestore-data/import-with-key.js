const admin = require('firebase-admin');

console.log('🔥 Firebase Admins Import dengan Service Account Key');
console.log('==================================================');

// Cek apakah service account key ada
const fs = require('fs');
const keyPath = './service-account-key.json';

if (!fs.existsSync(keyPath)) {
  console.log('❌ File service-account-key.json tidak ditemukan!');
  console.log('');
  console.log('📋 CARA DOWNLOAD SERVICE ACCOUNT KEY:');
  console.log('====================================');
  console.log('1. Buka Firebase Console: https://console.firebase.google.com');
  console.log('2. Pilih project: wavesoffood-94471');
  console.log('3. Klik ⚙️  → Project Settings');
  console.log('4. Tab "Service accounts"');
  console.log('5. Klik "Generate new private key"');
  console.log('6. Download file JSON');
  console.log('7. Rename menjadi "service-account-key.json"');
  console.log('8. Copy ke folder: firestore-data/');
  console.log('9. Jalankan script ini lagi');
  console.log('');
  process.exit(1);
}

// Initialize Firebase dengan service account
const serviceAccount = require(keyPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Data admins
const adminsData = {
  "admin_001": {
    "email": "admin@wavesoffood.com",
    "name": "Admin Waves of Food",
    "role": "admin",
    "isActive": true,
    "createdAt": admin.firestore.Timestamp.now(),
    "permissions": {
      "manageOrders": true,
      "manageMenu": true,
      "manageUsers": true,
      "viewDashboard": true
    }
  }
};

async function importAdmins() {
  try {
    console.log('✅ Service account key ditemukan!');
    console.log('📤 Memulai import collection admins...');
    
    for (const [adminId, adminData] of Object.entries(adminsData)) {
      console.log(`📝 Menambahkan admin: ${adminData.email}...`);
      
      await db.collection('admins').doc(adminId).set(adminData);
      
      console.log(`✅ Berhasil menambah admin: ${adminData.email}`);
    }
    
    console.log('');
    console.log('🎉 IMPORT BERHASIL!');
    console.log('==================');
    console.log('✅ Collection "admins" berhasil dibuat');
    console.log('✅ Document admin_001 berhasil ditambahkan');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('Email: admin@wavesoffood.com');
    console.log('Password: (Buat di Firebase Authentication)');
    console.log('');
    console.log('⚠️  NEXT: Setup Authentication User');
    console.log('===================================');
    console.log('1. Firebase Console → Authentication');
    console.log('2. Enable Email/Password sign-in');
    console.log('3. Add user: admin@wavesoffood.com');
    console.log('4. Password: admin123456');
    
    // Verify the data was created
    console.log('');
    console.log('🔍 Verifikasi data yang dibuat:');
    console.log('==============================');
    
    const adminDoc = await db.collection('admins').doc('admin_001').get();
    if (adminDoc.exists) {
      console.log('✅ Document admin_001 berhasil dibuat dan terverifikasi!');
      console.log('📄 Data:', adminDoc.data());
    } else {
      console.log('❌ Document admin_001 tidak ditemukan');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', error);
    
    if (error.code === 'app/invalid-credential') {
      console.log('\n💡 SOLUTION:');
      console.log('============');
      console.log('Service account key mungkin tidak valid atau expired.');
      console.log('Download ulang dari Firebase Console:');
      console.log('1. Project Settings → Service accounts');
      console.log('2. Generate new private key');
      console.log('3. Save as "service-account-key.json"');
    }
    
    process.exit(1);
  }
}

importAdmins();
