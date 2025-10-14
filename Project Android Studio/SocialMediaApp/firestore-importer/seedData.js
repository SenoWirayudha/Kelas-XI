const { db } = require('./firebase-config');
const { sampleUsers, samplePosts, sampleStories, sampleNotifications, sampleComments } = require('./sampleData');

async function seedUsers() {
  console.log('🔄 Seeding users...');
  const batch = db.batch();
  
  sampleUsers.forEach(user => {
    const userRef = db.collection('users').doc(user.id);
    batch.set(userRef, user);
  });
  
  await batch.commit();
  console.log('✅ Users seeded successfully!');
}

async function seedPosts() {
  console.log('🔄 Seeding posts...');
  const batch = db.batch();
  
  samplePosts.forEach(post => {
    const postRef = db.collection('posts').doc(post.id);
    batch.set(postRef, post);
  });
  
  await batch.commit();
  console.log('✅ Posts seeded successfully!');
}

async function seedStories() {
  console.log('🔄 Seeding stories...');
  const batch = db.batch();
  
  sampleStories.forEach(story => {
    const storyRef = db.collection('stories').doc(story.id);
    batch.set(storyRef, story);
  });
  
  await batch.commit();
  console.log('✅ Stories seeded successfully!');
}

async function seedNotifications() {
  console.log('🔄 Seeding notifications...');
  const batch = db.batch();
  
  sampleNotifications.forEach(notification => {
    const notificationRef = db.collection('notifications').doc(notification.id);
    batch.set(notificationRef, notification);
  });
  
  await batch.commit();
  console.log('✅ Notifications seeded successfully!');
}

async function seedComments() {
  console.log('🔄 Seeding comments...');
  const batch = db.batch();
  
  sampleComments.forEach(comment => {
    const commentRef = db.collection('comments').doc(comment.id);
    batch.set(commentRef, comment);
  });
  
  await batch.commit();
  console.log('✅ Comments seeded successfully!');
}

async function seedAllData() {
  try {
    console.log('🚀 Starting data seeding process...\n');
    
    await seedUsers();
    await seedPosts();
    await seedStories();
    await seedNotifications();
    await seedComments();
    
    console.log('\n🎉 All sample data seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   • ${sampleUsers.length} users`);
    console.log(`   • ${samplePosts.length} posts`);
    console.log(`   • ${sampleStories.length} stories`);
    console.log(`   • ${sampleNotifications.length} notifications`);
    console.log(`   • ${sampleComments.length} comments`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAllData();
}

module.exports = {
  seedUsers,
  seedPosts,
  seedStories,
  seedNotifications,
  seedComments,
  seedAllData
};
