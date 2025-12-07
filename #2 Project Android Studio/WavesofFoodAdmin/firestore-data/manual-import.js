console.log('🔥 MANUAL IMPORT COLLECTION ADMINS');
console.log('==================================');
console.log('');

console.log('📋 Karena belum ada service account key, kita akan import manual');
console.log('');

console.log('🎯 LANGKAH 1: BUKA FIREBASE CONSOLE');
console.log('===================================');
console.log('1. Buka: https://console.firebase.google.com');
console.log('2. Pilih project: wavesoffood-94471');
console.log('3. Klik "Firestore Database"');
console.log('');

console.log('🎯 LANGKAH 2: BUAT COLLECTION');
console.log('==============================');
console.log('1. Klik "Start collection" (di panel kiri)');
console.log('2. Collection ID: admins');
console.log('3. Document ID: admin_001');
console.log('');

console.log('🎯 LANGKAH 3: TAMBAH FIELDS');
console.log('============================');
console.log('Copy-paste data berikut ke Firestore:');
console.log('');

// Generate data yang mudah di-copy
const adminData = {
  email: "admin@wavesoffood.com",
  name: "Admin Waves of Food", 
  role: "admin",
  isActive: true,
  permissions: {
    manageOrders: true,
    manageMenu: true,
    manageUsers: true,
    viewDashboard: true
  }
};

console.log('Field | Type | Value');
console.log('------|------|------');
console.log('email | string | admin@wavesoffood.com');
console.log('name | string | Admin Waves of Food');
console.log('role | string | admin');
console.log('isActive | boolean | true');
console.log('createdAt | timestamp | (pilih tanggal hari ini)');
console.log('');

console.log('🗺️  PERMISSIONS (type: map):');
console.log('============================');
console.log('permissions.manageOrders | boolean | true');
console.log('permissions.manageMenu | boolean | true');
console.log('permissions.manageUsers | boolean | true');
console.log('permissions.viewDashboard | boolean | true');
console.log('');

console.log('🎯 LANGKAH 4: SETUP AUTHENTICATION');
console.log('===================================');
console.log('1. Klik tab "Authentication"');
console.log('2. Klik "Get started" (jika belum aktif)');
console.log('3. Tab "Sign-in method" → Enable "Email/Password"');
console.log('4. Tab "Users" → "Add user"');
console.log('5. Email: admin@wavesoffood.com');
console.log('6. Password: admin123456');
console.log('');

console.log('✅ SELESAI! Test login aplikasi dengan:');
console.log('=======================================');
console.log('Email: admin@wavesoffood.com');
console.log('Password: admin123456');
console.log('');

console.log('💡 TIPS: Jika ingin import otomatis next time:');
console.log('==============================================');
console.log('1. Download service account key dari Firebase Console');
console.log('2. Save sebagai "service-account-key.json"');
console.log('3. Jalankan: node import-with-key.js');

// Save data to JSON file untuk referensi
const fs = require('fs');
fs.writeFileSync('./admin-data-copy.json', JSON.stringify(adminData, null, 2));
console.log('📄 Data admin disimpan ke: admin-data-copy.json');
