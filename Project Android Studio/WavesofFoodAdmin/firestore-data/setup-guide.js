console.log('🔥 FIREBASE ADMINS COLLECTION SETUP');
console.log('===================================');
console.log('');

console.log('📋 LANGKAH-LANGKAH IMPORT COLLECTION ADMINS:');
console.log('');

console.log('1️⃣  BUKA FIREBASE CONSOLE');
console.log('   → https://console.firebase.google.com');
console.log('   → Pilih project Waves of Food Anda');
console.log('');

console.log('2️⃣  BUAT COLLECTION ADMINS');
console.log('   → Klik "Firestore Database"');
console.log('   → Klik "Start collection"');
console.log('   → Collection ID: admins');
console.log('   → Document ID: admin_001');
console.log('');

console.log('3️⃣  TAMBAH DATA ADMIN UTAMA');
console.log('   Field | Type | Value');
console.log('   ------|------|-------');
console.log('   email | string | admin@wavesoffood.com');
console.log('   name | string | Admin Waves of Food');
console.log('   role | string | admin');
console.log('   isActive | boolean | true');
console.log('   createdAt | timestamp | (pilih tanggal hari ini)');
console.log('');

console.log('4️⃣  TAMBAH PERMISSIONS (MAP)');
console.log('   Field | Type | Value');
console.log('   ------|------|-------');
console.log('   permissions.manageOrders | boolean | true');
console.log('   permissions.manageMenu | boolean | true');
console.log('   permissions.manageUsers | boolean | true');
console.log('   permissions.viewDashboard | boolean | true');
console.log('');

console.log('5️⃣  SETUP AUTHENTICATION');
console.log('   → Klik tab "Authentication"');
console.log('   → Klik "Get started" (jika belum aktif)');
console.log('   → Tab "Sign-in method" → Enable "Email/Password"');
console.log('   → Tab "Users" → "Add user"');
console.log('   → Email: admin@wavesoffood.com');
console.log('   → Password: admin123456');
console.log('   → Klik "Add user"');
console.log('');

console.log('6️⃣  TEST LOGIN APLIKASI');
console.log('   → Build aplikasi Android');
console.log('   → Install ke device/emulator');
console.log('   → Login dengan:');
console.log('     Email: admin@wavesoffood.com');
console.log('     Password: admin123456');
console.log('');

console.log('✅ SELESAI! Aplikasi siap digunakan!');
console.log('');

console.log('🔑 CREDENTIALS UNTUK LOGIN:');
console.log('   Email: admin@wavesoffood.com');
console.log('   Password: admin123456');
console.log('   (Ganti password setelah login pertama)');
console.log('');

console.log('📱 FITUR YANG BISA DIAKSES:');
console.log('   ✅ Dashboard dengan statistik');
console.log('   ✅ Kelola Menu (CRUD)');
console.log('   ✅ Kelola Pesanan (Update status)');
console.log('   ✅ Kelola Pengguna (View & search)');
console.log('   ✅ Upload gambar makanan');
console.log('');

// Generate copy-paste data for easy manual entry
console.log('📋 COPY-PASTE DATA FOR FIRESTORE:');
console.log('==================================');

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

console.log('Document ID: admin_001');
console.log('Data (JSON format):');
console.log(JSON.stringify(adminData, null, 2));
console.log('');

console.log('🎉 Script selesai! Silakan ikuti langkah manual di atas.');
