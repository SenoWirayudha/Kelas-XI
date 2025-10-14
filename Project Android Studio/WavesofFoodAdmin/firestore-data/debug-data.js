const admin = require('firebase-admin');

console.log('🔍 DEBUG FIRESTORE DATA');
console.log('======================');

// Initialize Firebase
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugCollections() {
  try {
    console.log('📊 CHECKING COLLECTIONS...');
    console.log('==========================');
    
    // Check users collection
    console.log('\n👥 USERS COLLECTION:');
    console.log('====================');
    
    const usersSnapshot = await db.collection('users').limit(5).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in collection');
    } else {
      console.log(`✅ Found ${usersSnapshot.size} users`);
      
      usersSnapshot.forEach(doc => {
        console.log(`📄 Document ID: ${doc.id}`);
        console.log(`   Data:`, doc.data());
        console.log('');
      });
    }
    
    // Check orders collection
    console.log('\n📦 ORDERS COLLECTION:');
    console.log('=====================');
    
    const ordersSnapshot = await db.collection('orders').limit(5).get();
    
    if (ordersSnapshot.empty) {
      console.log('❌ No orders found in collection');
    } else {
      console.log(`✅ Found ${ordersSnapshot.size} orders`);
      
      ordersSnapshot.forEach(doc => {
        console.log(`📄 Document ID: ${doc.id}`);
        console.log(`   Data:`, doc.data());
        console.log('');
      });
    }
    
    // Check foods collection
    console.log('\n🍽️ FOODS COLLECTION:');
    console.log('====================');
    
    const foodsSnapshot = await db.collection('foods').limit(5).get();
    
    if (foodsSnapshot.empty) {
      console.log('❌ No foods found in collection');
    } else {
      console.log(`✅ Found ${foodsSnapshot.size} foods`);
      
      foodsSnapshot.forEach(doc => {
        console.log(`📄 Document ID: ${doc.id}`);
        console.log(`   Data:`, doc.data());
        console.log('');
      });
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('===========');
    console.log(`Users: ${usersSnapshot.size} documents`);
    console.log(`Orders: ${ordersSnapshot.size} documents`);
    console.log(`Foods: ${foodsSnapshot.size} documents`);
    
    if (usersSnapshot.empty && ordersSnapshot.empty) {
      console.log('\n💡 RECOMMENDATION:');
      console.log('==================');
      console.log('Koleksi users dan orders kosong.');
      console.log('Kemungkinan:');
      console.log('1. Data belum dibuat dari aplikasi customer');
      console.log('2. Field names tidak cocok');
      console.log('3. Database rules membatasi akses');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('============');
      console.log('1. Buat dummy data untuk testing');
      console.log('2. Cek Firebase Console → Firestore');
      console.log('3. Pastikan aplikasi customer sudah buat data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCollections();
