const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin with unique app name
const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
}, `verify-${Date.now()}`);

const db = app.firestore();

async function checkImportedData() {
    console.log('🔍 Verifying imported data in Firebase...\n');
    
    try {
        // Check users
        console.log('👥 USERS COLLECTION:');
        console.log('='.repeat(30));
        const usersSnapshot = await db.collection('users').get();
        console.log(`Total users: ${usersSnapshot.size}`);
        
        for (const doc of usersSnapshot.docs) {
            const user = doc.data();
            console.log(`✅ ${doc.id}: ${user.name} (${user.email}) - Role: ${user.role}`);
        }
        
        console.log('\n🍽️ FOODS COLLECTION:');
        console.log('='.repeat(30));
        const foodsSnapshot = await db.collection('foods').get();
        console.log(`Total foods: ${foodsSnapshot.size}`);
        
        for (const doc of foodsSnapshot.docs) {
            const food = doc.data();
            console.log(`✅ ${doc.id}: ${food.name} (${food.category}) - Rp ${food.price.toLocaleString()}`);
        }
        
        console.log('\n📦 ORDERS COLLECTION:');
        console.log('='.repeat(30));
        const ordersSnapshot = await db.collection('orders').get();
        console.log(`Total orders: ${ordersSnapshot.size}`);
        
        for (const doc of ordersSnapshot.docs) {
            const order = doc.data();
            console.log(`✅ ${doc.id}: User ${order.userId} - ${order.status} - Rp ${order.total.toLocaleString()}`);
        }
        
        console.log('\n🏠 ADDRESSES (for user1):');
        console.log('='.repeat(30));
        const addressesSnapshot = await db.collection('users').doc('user1').collection('addresses').get();
        console.log(`Total addresses: ${addressesSnapshot.size}`);
        
        for (const doc of addressesSnapshot.docs) {
            const addr = doc.data();
            console.log(`✅ ${doc.id}: ${addr.label} - ${addr.fullAddress.substring(0, 50)}...`);
        }
        
        console.log('\n⭐ REVIEWS (for food1):');
        console.log('='.repeat(30));
        const reviewsSnapshot = await db.collection('foods').doc('food1').collection('reviews').get();
        console.log(`Total reviews: ${reviewsSnapshot.size}`);
        
        for (const doc of reviewsSnapshot.docs) {
            const review = doc.data();
            console.log(`✅ ${doc.id}: ${review.userName} - ${review.rating}/5 stars`);
            console.log(`   "${review.comment}"`);
        }
        
        console.log('\n📊 IMPORT SUMMARY:');
        console.log('='.repeat(40));
        console.log(`✅ Users: ${usersSnapshot.size}/3 expected`);
        console.log(`✅ Foods: ${foodsSnapshot.size}/8 expected`);
        console.log(`✅ Orders: ${ordersSnapshot.size}/3 expected`);
        console.log(`✅ Addresses: ${addressesSnapshot.size}/2 expected for user1`);
        console.log(`✅ Reviews: ${reviewsSnapshot.size}/2 expected for food1`);
        
        const totalExpected = 3 + 8 + 3 + 2 + 2; // users + foods + orders + addresses + reviews
        const totalActual = usersSnapshot.size + foodsSnapshot.size + ordersSnapshot.size + addressesSnapshot.size + reviewsSnapshot.size;
        
        console.log(`\n🎯 Overall: ${totalActual}/${totalExpected} documents imported`);
        
        if (totalActual === totalExpected) {
            console.log('🎉 ALL DATA IMPORTED SUCCESSFULLY!');
        } else {
            console.log('⚠️  Some data may be missing. Check Firestore rules if needed.');
        }
        
    } catch (error) {
        console.error('❌ Error verifying data:', error.message);
        console.error('   This might be due to Firestore security rules.');
        console.error('   Check your Firebase Console for the actual data.');
    }
    
    await app.delete();
    process.exit(0);
}

checkImportedData();
