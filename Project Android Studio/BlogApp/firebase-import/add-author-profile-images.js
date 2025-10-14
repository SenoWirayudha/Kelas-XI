const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addAuthorProfileImagesToPosts() {
  try {
    console.log('🔍 Menambahkan foto profil author ke blog posts yang sudah ada...\n');
    
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
      console.log(`   Current authorProfileImage: ${postData.authorProfileImage ? 'Ada' : 'Kosong'}`);
      
      // Check if author profile image is missing
      if (!postData.authorProfileImage || postData.authorProfileImage.trim() === '') {
        console.log('   ⚠️  Author profile image kosong, mencari foto profil user...');
        
        if (postData.authorId) {
          try {
            // Get user data from Firestore
            const userDoc = await db.collection('users').doc(postData.authorId).get();
            
            if (userDoc.exists) {
              const userData = userDoc.data();
              const profileImage = userData.profileImageBase64 || '';
              
              if (profileImage) {
                console.log(`   ✅ Profile image ditemukan! Length: ${profileImage.length}`);
                
                // Update the post with author profile image
                await postDoc.ref.update({
                  authorProfileImage: profileImage
                });
                
                console.log(`   ✅ Post updated dengan author profile image`);
                updatedCount++;
              } else {
                console.log('   ℹ️  User tidak memiliki profile image, skip');
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
      } else {
        console.log('   ✅ Author profile image sudah ada, skip');
        skippedCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 HASIL UPDATE:');
    console.log(`✅ Posts diupdate: ${updatedCount}`);
    console.log(`⏭️  Posts di-skip: ${skippedCount}`);
    console.log(`📝 Total posts: ${postsSnapshot.size}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Update selesai! Author profile images telah ditambahkan ke blog posts.');
      console.log('💡 Silakan test aplikasi untuk melihat foto profil author di blog posts.');
    } else {
      console.log('\n✅ Tidak ada posts yang perlu diupdate.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the update
addAuthorProfileImagesToPosts();
