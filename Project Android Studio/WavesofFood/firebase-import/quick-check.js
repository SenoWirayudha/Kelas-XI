const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
}, `check-${Date.now()}`);

const db = app.firestore();

async function quickCheck() {
    console.log('🔍 Quick Database Check...\n');
    
    try {
        // Count collections
        const [users, foods, orders] = await Promise.all([
            db.collection('users').get(),
            db.collection('foods').get(), 
            db.collection('orders').get()
        ]);
        
        console.log('📊 DATABASE STATUS:');
        console.log('==================');
        console.log(`👥 Users: ${users.size} documents`);
        console.log(`🍽️ Foods: ${foods.size} documents`);
        console.log(`📦 Orders: ${orders.size} documents`);
        
        if (users.size > 0) {
            console.log('\n✅ Database has data!');
            console.log('🌐 Check Firebase Console to see all collections');
        } else {
            console.log('\n❌ Database is still empty');
            console.log('💡 Try running: node import-data.js');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    await app.delete();
    process.exit(0);
}

quickCheck();
