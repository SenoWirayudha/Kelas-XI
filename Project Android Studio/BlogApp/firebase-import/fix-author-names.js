const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixMissingAuthorNames() {
  try {
    console.log('🔍 Mencari blog posts dengan author name kosong...\n');
    
    // Get all blog posts
    const postsSnapshot = await db.collection('posts').get();
    
    if (postsSnapshot.empty) {
      console.log('❌ Tidak ada blog posts ditemukan');
      return;
    }
    
    console.log(`📊 Total blog posts: ${postsSnapshot.size}`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    // Process each post
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      const postId = postDoc.id;
      
      console.log(`\n📝 Processing post: ${postId}`);
      console.log(`   Title: ${postData.title}`);
      console.log(`   Current authorName: "${postData.authorName}"`);
      console.log(`   AuthorId: ${postData.authorId}`);
      
      // Check if author name is missing or empty
      if (!postData.authorName || postData.authorName.trim() === '' || postData.authorName === 'Anonymous') {
        console.log('   ⚠️  Author name kosong atau Anonymous, mencari data user...');
        
        if (postData.authorId) {
          try {
            // Get user data from Firestore
            const userDoc = await db.collection('users').doc(postData.authorId).get();
            
            if (userDoc.exists) {
              const userData = userDoc.data();
              const newAuthorName = userData.displayName || userData.email?.split('@')[0] || 'Anonymous';
              
              console.log(`   ✅ User data ditemukan: ${newAuthorName}`);
              
              // Update the post with correct author name
              await postDoc.ref.update({
                authorName: newAuthorName
              });
              
              console.log(`   ✅ Post updated dengan author name: ${newAuthorName}`);
              fixedCount++;
            } else {
              console.log('   ❌ User document tidak ditemukan, menggunakan authorId sebagai fallback');
              
              // Use authorId as fallback
              await postDoc.ref.update({
                authorName: postData.authorId.substring(0, 8) + '...'
              });
              
              fixedCount++;
            }
          } catch (error) {
            console.log(`   ❌ Error getting user data: ${error.message}`);
            
            // Use authorId as fallback
            try {
              await postDoc.ref.update({
                authorName: postData.authorId ? postData.authorId.substring(0, 8) + '...' : 'Unknown User'
              });
              fixedCount++;
            } catch (updateError) {
              console.log(`   ❌ Failed to update post: ${updateError.message}`);
            }
          }
        } else {
          console.log('   ❌ Tidak ada authorId, skip post ini');
          skippedCount++;
        }
      } else {
        console.log('   ✅ Author name sudah ada, skip');
        skippedCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 HASIL PERBAIKAN:');
    console.log(`✅ Posts diperbaiki: ${fixedCount}`);
    console.log(`⏭️  Posts di-skip: ${skippedCount}`);
    console.log(`📝 Total posts: ${postsSnapshot.size}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Perbaikan selesai! Author names telah diperbarui.');
      console.log('💡 Silakan test aplikasi untuk memastikan author names muncul.');
    } else {
      console.log('\n✅ Tidak ada posts yang perlu diperbaiki.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixMissingAuthorNames();
