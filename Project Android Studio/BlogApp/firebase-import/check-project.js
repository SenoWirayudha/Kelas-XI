const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Function to check project status
async function checkProjectStatus() {
  try {
    console.log('🔍 Checking Firebase project status...');
    console.log(`📁 Project ID: ${serviceAccount.project_id}`);
    console.log(`📧 Service Account: ${serviceAccount.client_email}`);
    console.log('');
    
    // Try to list available databases
    console.log('🔄 Checking available services...');
    
    // Test 1: Check if we can access project info
    try {
      const projectRef = admin.firestore().settings({});
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.log('❌ Firebase Admin SDK initialization failed:', error.message);
    }
    
    // Test 2: Try minimal Firestore operation
    try {
      const db = admin.firestore();
      console.log('✅ Firestore client created');
      
      // Try to get any collection (this will fail if Firestore not enabled)
      await db.listCollections();
      console.log('✅ Firestore API is enabled and accessible');
      
    } catch (error) {
      console.log('❌ Firestore API issue:', error.message);
      
      if (error.message.includes('has not been used')) {
        console.log('');
        console.log('🎯 DIAGNOSIS: Firestore Database belum dibuat');
        console.log('📝 SOLUSI LENGKAP:');
        console.log('');
        console.log('1. Buka Firebase Console:');
        console.log('   https://console.firebase.google.com/project/blog-app-ee78d');
        console.log('');
        console.log('2. Di sidebar kiri, klik "Firestore Database"');
        console.log('');
        console.log('3. Klik tombol "Create database"');
        console.log('');
        console.log('4. Pilih "Start in test mode" (PENTING!)');
        console.log('   - Ini memberikan akses read/write untuk development');
        console.log('   - Security rules bisa diatur nanti');
        console.log('');
        console.log('5. Pilih location (contoh: asia-southeast1)');
        console.log('');
        console.log('6. Klik "Done" dan tunggu proses selesai');
        console.log('');
        console.log('7. Setelah selesai, tunggu 2-3 menit untuk propagation');
        console.log('');
        console.log('8. Jalankan: npm run simple-import');
        console.log('');
        console.log('💡 MENGAPA INI PERLU:');
        console.log('   - Firebase project default tidak punya Firestore');
        console.log('   - Firestore adalah service terpisah yang harus diaktifkan');
        console.log('   - Google Cloud APIs perlu di-enable secara manual');
        console.log('   - Test mode memberikan permissions yang dibutuhkan');
      }
    }
    
  } catch (error) {
    console.error('❌ Project check failed:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run project status check
checkProjectStatus();
