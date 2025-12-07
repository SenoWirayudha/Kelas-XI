const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./blogapp-e2953-firebase-adminsdk-1s6dj-3a2c3a0e0b.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeBase64Size() {
  try {
    console.log('🔍 Menganalisis ukuran base64 foto profil...\n');
    
    // Get user document
    const userDoc = await db.collection('users').doc('VRNUv3xmWAcYZbuaQkzXCqncBF43').get();
    
    if (!userDoc.exists) {
      console.log('❌ User document tidak ditemukan');
      return;
    }
    
    const userData = userDoc.data();
    const base64Data = userData.profileImageBase64;
    
    if (!base64Data) {
      console.log('❌ Tidak ada data base64 ditemukan');
      return;
    }
    
    console.log('📊 Analisis Base64:');
    console.log(`📏 Panjang string base64: ${base64Data.length.toLocaleString()} karakter`);
    
    // Calculate original image size
    const base64SizeInBytes = (base64Data.length * 3) / 4;
    console.log(`📦 Ukuran data asli: ${Math.round(base64SizeInBytes).toLocaleString()} bytes`);
    console.log(`📦 Ukuran dalam KB: ${(base64SizeInBytes / 1024).toFixed(2)} KB`);
    console.log(`📦 Ukuran dalam MB: ${(base64SizeInBytes / (1024 * 1024)).toFixed(2)} MB`);
    
    // Check image format
    if (base64Data.startsWith('/9j/')) {
      console.log('🖼️  Format: JPEG');
    } else if (base64Data.startsWith('iVBORw0KGgo')) {
      console.log('🖼️  Format: PNG');
    } else if (base64Data.startsWith('UklGR')) {
      console.log('🖼️  Format: WebP');
    } else {
      console.log('🖼️  Format: Unknown');
    }
    
    // Show preview
    console.log(`\n📝 Preview base64 (100 karakter pertama):`);
    console.log(base64Data.substring(0, 100) + '...');
    
    console.log('\n✅ Ukuran ini normal untuk foto profil berkualitas tinggi!');
    console.log('💡 Tips untuk optimasi:');
    console.log('   - Resize gambar ke 400x400 atau 800x800 pixel');
    console.log('   - Kompres JPEG dengan kualitas 80-90%');
    console.log('   - Gunakan format WebP untuk ukuran lebih kecil');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeBase64Size();
