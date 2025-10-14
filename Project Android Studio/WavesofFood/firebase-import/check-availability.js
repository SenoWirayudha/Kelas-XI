const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function checkAvailability() {
    console.log('🔍 Checking menu availability status...\n');
    
    try {
        const foodsSnapshot = await db.collection('foods').get();
        console.log(`Found ${foodsSnapshot.size} menu items:\n`);
        
        foodsSnapshot.forEach(doc => {
            const food = doc.data();
            const isAvailable = food.isAvailable !== undefined ? food.isAvailable : true;
            const status = isAvailable ? '✅ Available' : '❌ Not Available';
            console.log(`${status}: ${food.name}`);
        });
        
        console.log('\n✅ Availability check completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking availability:', error);
        process.exit(1);
    }
}

checkAvailability();
