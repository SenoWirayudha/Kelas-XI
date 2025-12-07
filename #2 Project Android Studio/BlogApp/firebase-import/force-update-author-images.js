const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function forceUpdateAuthorProfileImages() {
  try {
    console.log('🔄 Force update foto profil author di blog posts...\n');
    
    // Get all blog posts
    const postsSnapshot = await db.collection('posts').get();
    
    if (postsSnapshot.empty) {
      console.log('❌ Tidak ada blog posts ditemukan');
      return;
    }
    
    console.log(`📊 Total blog posts: ${postsSnapshot.size}`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each post
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      const postId = postDoc.id;
      
      console.log(`\n📝 Processing post: ${postId}`);
      console.log(`   Title: ${postData.title}`);
      console.log(`   Author: ${postData.authorName}`);
      console.log(`   AuthorId: ${postData.authorId}`);
      
      if (postData.authorId) {
        try {
          // Get latest user data from Firestore
          const userDoc = await db.collection('users').doc(postData.authorId).get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            const latestProfileImage = userData.profileImageBase64 || '';
            
            console.log(`   Current post image: ${postData.authorProfileImage ? postData.authorProfileImage.length + ' chars' : 'KOSONG'}`);
            console.log(`   Latest user image: ${latestProfileImage ? latestProfileImage.length + ' chars' : 'KOSONG'}`);
            
            if (latestProfileImage) {
              // Force update with latest profile image
              await postDoc.ref.update({
                authorProfileImage: latestProfileImage
              });
              
              console.log(`   ✅ Force updated dengan latest profile image (${latestProfileImage.length} chars)`);
              updatedCount++;
            } else {
              console.log('   ⚠️  User tidak memiliki profile image, skip');
              skippedCount++;
            }
          } else {
            console.log('   ❌ User document tidak ditemukan, skip');
            skippedCount++;
          }
        } catch (error) {
          console.log(`   ❌ Error getting user data: ${error.message}`);
          skippedCount++;
        }
      } else {
        console.log('   ❌ Tidak ada authorId, skip post ini');
        skippedCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 HASIL FORCE UPDATE:');
    console.log(`✅ Posts diupdate: ${updatedCount}`);
    console.log(`⏭️  Posts di-skip: ${skippedCount}`);
    console.log(`📝 Total posts: ${postsSnapshot.size}`);
    
    console.log('\n🎉 Force update selesai! Foto profil author telah diupdate dengan yang terbaru.');
    console.log('💡 Silakan test aplikasi untuk melihat hasil update.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the force update
forceUpdateAuthorProfileImages();
