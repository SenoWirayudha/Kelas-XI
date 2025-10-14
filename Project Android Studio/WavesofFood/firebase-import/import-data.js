const admin = require('firebase-admin');
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

// Initialize Firebase Admin SDK
function initializeFirebase() {
  try {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ Service account key file not found:', serviceAccountPath);
      console.log('📝 Please download your service account key from Firebase Console:');
      console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('   2. Click "Generate new private key"');
      console.log('   3. Save the file as "service-account-key.json" in this directory');
      process.exit(1);
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    process.exit(1);
  }
}

// Import users
async function importUsers(db) {
  console.log('📝 Importing users...');
  
  for (const user of sampleUsers) {
    try {
      await db.collection('users').doc(user.id).set(user);
      console.log(`  ✅ User imported: ${user.name} (${user.email})`);
    } catch (error) {
      console.error(`  ❌ Error importing user ${user.name}:`, error.message);
    }
  }
}

// Import addresses
async function importAddresses(db) {
  console.log('📝 Importing addresses...');
  
  for (const userAddresses of sampleAddresses) {
    for (const address of userAddresses.addresses) {
      try {
        await db
          .collection('users')
          .doc(userAddresses.userId)
          .collection('addresses')
          .doc(address.id)
          .set({
            label: address.label,
            fullAddress: address.fullAddress,
            recipientName: address.recipientName,
            phone: address.phone,
            notes: address.notes,
            isDefault: address.isDefault
          });
        console.log(`  ✅ Address imported: ${address.label} for user ${userAddresses.userId}`);
      } catch (error) {
        console.error(`  ❌ Error importing address:`, error.message);
      }
    }
  }
}

// Import foods
async function importFoods(db) {
  console.log('📝 Importing foods...');
  
  for (const food of sampleFoods) {
    try {
      await db.collection('foods').doc(food.id).set(food);
      console.log(`  ✅ Food imported: ${food.name} (${food.category})`);
    } catch (error) {
      console.error(`  ❌ Error importing food ${food.name}:`, error.message);
    }
  }
}

// Import reviews
async function importReviews(db) {
  console.log('📝 Importing reviews...');
  
  for (const foodReviews of sampleReviews) {
    for (const review of foodReviews.reviews) {
      try {
        await db
          .collection('foods')
          .doc(foodReviews.foodId)
          .collection('reviews')
          .doc(review.id)
          .set({
            userId: review.userId,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment,
            createdAt: admin.firestore.Timestamp.fromDate(review.createdAt)
          });
        console.log(`  ✅ Review imported for food ${foodReviews.foodId} by ${review.userName}`);
      } catch (error) {
        console.error(`  ❌ Error importing review:`, error.message);
      }
    }
  }
}

// Import orders
async function importOrders(db) {
  console.log('📝 Importing orders...');
  
  for (const order of sampleOrders) {
    try {
      await db.collection('orders').doc(order.id).set({
        ...order,
        createdAt: admin.firestore.Timestamp.fromDate(order.createdAt),
        updatedAt: admin.firestore.Timestamp.fromDate(order.updatedAt)
      });
      console.log(`  ✅ Order imported: ${order.id} for user ${order.userId}`);
    } catch (error) {
      console.error(`  ❌ Error importing order ${order.id}:`, error.message);
    }
  }
}

// Main import function
async function importAllData() {
  console.log('🚀 Starting Firebase data import...\n');
  
  const db = initializeFirebase();
  
  try {
    // Import data in sequence
    await importUsers(db);
    console.log('');
    
    await importAddresses(db);
    console.log('');
    
    await importFoods(db);
    console.log('');
    
    await importReviews(db);
    console.log('');
    
    await importOrders(db);
    console.log('');
    
    console.log('🎉 All data imported successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${sampleUsers.length}`);
    console.log(`   - Foods: ${sampleFoods.length}`);
    console.log(`   - Orders: ${sampleOrders.length}`);
    console.log(`   - Reviews: ${sampleReviews.reduce((total, food) => total + food.reviews.length, 0)}`);
    console.log(`   - Addresses: ${sampleAddresses.reduce((total, user) => total + user.addresses.length, 0)}`);
    
  } catch (error) {
    console.error('❌ Error during import:', error.message);
  } finally {
    process.exit(0);
  }
}

// Clear all data function (optional)
async function clearAllData() {
  console.log('🗑️  Clearing all data...\n');
  
  const db = initializeFirebase();
  
  try {
    // Delete collections
    const collections = ['users', 'foods', 'orders'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`  ✅ Cleared collection: ${collectionName}`);
    }
    
    console.log('\n🎉 All data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error during clearing:', error.message);
  } finally {
    process.exit(0);
  }
}

// Command line arguments handling
const command = process.argv[2];

if (command === 'clear') {
  clearAllData();
} else {
  importAllData();
}
