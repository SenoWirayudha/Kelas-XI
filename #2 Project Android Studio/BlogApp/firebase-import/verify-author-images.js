const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyAuthorProfileImages() {
  try {
    console.log('🔍 Memverifikasi foto profil author di blog posts...\n');
    
    // Get all blog posts
    const postsSnapshot = await db.collection('posts').get();
    
    if (postsSnapshot.empty) {
      console.log('❌ Tidak ada blog posts ditemukan');
      return;
    }
    
    console.log(`📊 Total blog posts: ${postsSnapshot.size}\n`);
    
    // Process each post
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      const postId = postDoc.id;
      
      console.log(`📝 Post: ${postId}`);
      console.log(`   Title: ${postData.title}`);
      console.log(`   Author: ${postData.authorName}`);
      console.log(`   AuthorId: ${postData.authorId}`);
      console.log(`   AuthorProfileImage: ${postData.authorProfileImage ? 'ADA (' + postData.authorProfileImage.length + ' chars)' : 'KOSONG'}`);
      
      if (postData.authorProfileImage) {
        // Verify it's valid base64
        try {
          const buffer = Buffer.from(postData.authorProfileImage, 'base64');
          console.log(`   ✅ Valid base64 image (${buffer.length} bytes)`);
        } catch (e) {
          console.log(`   ❌ Invalid base64 format`);
        }
      }
      
      console.log(''); // Empty line for spacing
    }
    
    console.log('🎉 Verifikasi selesai!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the verification
verifyAuthorProfileImages();
