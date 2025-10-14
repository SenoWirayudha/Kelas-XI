const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  sampleUsers,
  sampleAddresses,
  sampleFoods,
  sampleReviews,
  sampleOrders
} = require('./sample-data');

// Demo function to show what would be imported
function demoImport() {
  console.log('🚀 DEMO: Firebase Data Import Preview\n');
  console.log('📋 This is a preview of what would be imported to Firebase:\n');

  // Show users
  console.log('👥 USERS COLLECTION:');
  console.log('='.repeat(50));
  sampleUsers.forEach(user => {
    console.log(`📤 users/${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Phone: ${user.phone}`);
    console.log('');
  });

  // Show addresses
  console.log('🏠 ADDRESSES SUBCOLLECTION:');
  console.log('='.repeat(50));
  sampleAddresses.forEach(userAddr => {
    userAddr.addresses.forEach(addr => {
      console.log(`📤 users/${userAddr.userId}/addresses/${addr.id}`);
      console.log(`   Label: ${addr.label}`);
      console.log(`   Address: ${addr.fullAddress}`);
      console.log(`   Default: ${addr.isDefault}`);
      console.log('');
    });
  });

  // Show foods
  console.log('🍽️ FOODS COLLECTION:');
  console.log('='.repeat(50));
  sampleFoods.forEach(food => {
    console.log(`📤 foods/${food.id}`);
    console.log(`   Name: ${food.name}`);
    console.log(`   Category: ${food.category}`);
    console.log(`   Price: Rp ${food.price.toLocaleString()}`);
    console.log(`   Rating: ${food.rating} (${food.reviewCount} reviews)`);
    console.log('');
  });

  // Show reviews
  console.log('⭐ REVIEWS SUBCOLLECTION:');
  console.log('='.repeat(50));
  sampleReviews.forEach(foodReview => {
    foodReview.reviews.forEach(review => {
      console.log(`📤 foods/${foodReview.foodId}/reviews/${review.id}`);
      console.log(`   User: ${review.userName}`);
      console.log(`   Rating: ${review.rating}/5`);
      console.log(`   Comment: "${review.comment}"`);
      console.log('');
    });
  });

  // Show orders
  console.log('📦 ORDERS COLLECTION:');
  console.log('='.repeat(50));
  sampleOrders.forEach(order => {
    console.log(`📤 orders/${order.id}`);
    console.log(`   User: ${order.userId}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: Rp ${order.total.toLocaleString()}`);
    console.log(`   Items: ${order.items.length} items`);
    order.items.forEach(item => {
      console.log(`     - ${item.name} x${item.quantity} = Rp ${item.totalPrice.toLocaleString()}`);
    });
    console.log('');
  });

  // Summary
  console.log('📊 IMPORT SUMMARY:');
  console.log('='.repeat(50));
  console.log(`✅ Users: ${sampleUsers.length}`);
  console.log(`✅ Foods: ${sampleFoods.length}`);
  console.log(`✅ Orders: ${sampleOrders.length}`);
  console.log(`✅ Reviews: ${sampleReviews.reduce((total, food) => total + food.reviews.length, 0)}`);
  console.log(`✅ Addresses: ${sampleAddresses.reduce((total, user) => total + user.addresses.length, 0)}`);
  
  console.log('\n🔥 TO ACTUALLY IMPORT THIS DATA TO FIREBASE:');
  console.log('1. Download service-account-key.json from Firebase Console');
  console.log('2. Place it in this directory');
  console.log('3. Run: node import-data.js');
  console.log('\nSee SETUP-INSTRUCTIONS.txt for detailed steps.');
}

// Check if service account key exists
const serviceAccountPath = './service-account-key.json';
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Service account key found. Use: node import-data.js');
} else {
  console.log('⚠️  Service account key not found. Running demo preview...\n');
  demoImport();
}
