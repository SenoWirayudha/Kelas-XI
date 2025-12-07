const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
}, 'testApp');

const db = admin.firestore();

async function checkImportedData() {
    console.log('🔍 Checking imported data...\n');
    
    try {
        // Check users
        const usersSnapshot = await db.collection('users').get();
        console.log(`👥 Users imported: ${usersSnapshot.size}`);
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            console.log(`   - ${user.name} (${user.role})`);
        });
        
        console.log('');
        
        // Check foods
        const foodsSnapshot = await db.collection('foods').get();
        console.log(`🍽️ Foods imported: ${foodsSnapshot.size}`);
        foodsSnapshot.forEach(doc => {
            const food = doc.data();
            console.log(`   - ${food.name} (${food.category}) - Rp ${food.price.toLocaleString()}`);
        });
        
        console.log('');
        
        // Check orders
        const ordersSnapshot = await db.collection('orders').get();
        console.log(`📦 Orders imported: ${ordersSnapshot.size}`);
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            console.log(`   - Order ${doc.id}: ${order.status} - Rp ${order.total.toLocaleString()}`);
        });
        
        console.log('');
        
        // Check addresses for first user
        const addressesSnapshot = await db.collection('users').doc('user1').collection('addresses').get();
        console.log(`🏠 Addresses for user1: ${addressesSnapshot.size}`);
        addressesSnapshot.forEach(doc => {
            const addr = doc.data();
            console.log(`   - ${addr.label}: ${addr.fullAddress}`);
        });
        
        console.log('');
        
        // Check reviews for first food
        const reviewsSnapshot = await db.collection('foods').doc('food1').collection('reviews').get();
        console.log(`⭐ Reviews for food1: ${reviewsSnapshot.size}`);
        reviewsSnapshot.forEach(doc => {
            const review = doc.data();
            console.log(`   - ${review.userName}: ${review.rating}/5 - "${review.comment}"`);
        });
        
        console.log('\n✅ Data verification complete!');
        
    } catch (error) {
        console.error('❌ Error checking data:', error.message);
    }
    
    process.exit(0);
}

checkImportedData();
