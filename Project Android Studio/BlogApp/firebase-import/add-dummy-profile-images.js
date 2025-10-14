const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Sample profile images (base64 encoded small images)
const sampleProfiles = [
  // Dummy avatar 1 - Blue circle
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAANElEQVQYV2P8//8/AxYwirkjCxiReFFEUWHJJ9YBvYkKjGz8KAZU4sXD4Aw+jA6M4yYwAJAlGEn9LQiDAAAAAElFTkSuQmCC',
  
  // Dummy avatar 2 - Green circle  
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAANElEQVQYV2P8z8DAwIglAMTIwtjEKNbIBBLFJg6ikcWQ+VHksMmB+LAJIsth08MmiU0cXQ4AQy0T7vNzYTcAAAAASUVORK5CYII=',
  
  // Dummy avatar 3 - Orange circle
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAANElEQVQYV2P8z8DAwAgiYAJGNnEQjSKGzY9NDJsCiB+bGDY5bH5s4tj8sMlh82MTxyYOAD5dE+7zc2F3AAAAAElFTkSuQmCC'
];

async function addDummyProfileImages() {
  try {
    console.log('🔍 Menambahkan foto profil dummy ke users...\n');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ Tidak ada users ditemukan');
      return;
    }
    
    console.log(`📊 Total users: ${usersSnapshot.size}`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n👤 Processing user: ${userId}`);
      console.log(`   Display Name: ${userData.displayName || 'N/A'}`);
      console.log(`   Current profileImageBase64: ${userData.profileImageBase64 ? 'Ada' : 'Kosong'}`);
      
      // Check if profile image is missing
      if (!userData.profileImageBase64 || userData.profileImageBase64.trim() === '') {
        console.log('   ⚠️  Profile image kosong, menambahkan foto dummy...');
        
        // Get random profile image
        const randomProfile = sampleProfiles[Math.floor(Math.random() * sampleProfiles.length)];
        
        // Update the user with dummy profile image
        await userDoc.ref.update({
          profileImageBase64: randomProfile
        });
        
        console.log(`   ✅ User updated dengan dummy profile image`);
        updatedCount++;
      } else {
        console.log('   ✅ Profile image sudah ada, skip');
        skippedCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 HASIL UPDATE:');
    console.log(`✅ Users diupdate: ${updatedCount}`);
    console.log(`⏭️  Users di-skip: ${skippedCount}`);
    console.log(`👤 Total users: ${usersSnapshot.size}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Update selesai! Dummy profile images telah ditambahkan ke users.');
      console.log('💡 Sekarang jalankan script add-author-profile-images.js lagi.');
    } else {
      console.log('\n✅ Tidak ada users yang perlu diupdate.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the update
addDummyProfileImages();
