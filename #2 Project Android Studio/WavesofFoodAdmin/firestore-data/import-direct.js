const admin = require('firebase-admin');
const fs = require('fs');

console.log('🔥 Firebase Admins Collection Import Script');
console.log('==========================================');

// Konfigurasi Firebase - ganti dengan project ID Anda
const FIREBASE_PROJECT_ID = 'wavesoffood-94471'; // Sesuaikan dengan project ID dari screenshot

// Initialize Firebase Admin SDK tanpa service account (untuk testing)
admin.initializeApp({
  projectId: FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Data admins yang akan diimport
const adminsData = {
  "admin_001": {
    "email": "admin@wavesoffood.com",
    "name": "Admin Waves of Food",
    "role": "admin",
    "isActive": true,
    "createdAt": new Date(),
    "permissions": {
      "manageOrders": true,
      "manageMenu": true,
      "manageUsers": true,
      "viewDashboard": true
    }
  },
  "admin_002": {
    "email": "manager@wavesoffood.com", 
    "name": "Manager Waves of Food",
    "role": "manager",
    "isActive": true,
    "createdAt": new Date(),
    "permissions": {
      "manageOrders": true,
      "manageMenu": true,
      "manageUsers": false,
      "viewDashboard": true
    }
  }
};

async function importAdmins() {
  try {
    console.log('📋 Starting import of admins collection...');
    
    // Import each admin document
    for (const [adminId, adminData] of Object.entries(adminsData)) {
      console.log(`📝 Adding admin: ${adminData.email}`);
      
      await db.collection('admins').doc(adminId).set(adminData);
      
      console.log(`✅ Successfully added: ${adminData.name}`);
    }
    
    console.log('\n🎉 Import completed successfully!');
    console.log('\n📋 Created admins:');
    console.log('================');
    
    for (const [adminId, adminData] of Object.entries(adminsData)) {
      console.log(`👤 ${adminData.name}`);
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Role: ${adminData.role}`);
      console.log(`   Active: ${adminData.isActive}`);
      console.log('');
    }
    
    console.log('🔑 Login Credentials:');
    console.log('=====================');
    console.log('Email: admin@wavesoffood.com');
    console.log('Password: (Buat di Firebase Authentication)');
    console.log('');
    
    console.log('⚠️  NEXT STEPS:');
    console.log('===============');
    console.log('1. Buka Firebase Console → Authentication');
    console.log('2. Tab "Users" → "Add user"');
    console.log('3. Email: admin@wavesoffood.com');
    console.log('4. Password: admin123456');
    console.log('5. Test login di aplikasi Android');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    
    if (error.code === 'app/invalid-credential') {
      console.log('\n💡 SOLUTION:');
      console.log('============');
      console.log('Download service account key dari Firebase Console:');
      console.log('1. Project Settings → Service accounts');
      console.log('2. Generate new private key');
      console.log('3. Save as "service-account-key.json"');
      console.log('4. Uncomment baris credential di script ini');
    }
    
    process.exit(1);
  }
}

// Jalankan import
importAdmins();
