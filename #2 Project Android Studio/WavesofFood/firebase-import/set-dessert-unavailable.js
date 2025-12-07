const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function setDessertUnavailable() {
    console.log('Setting specific dessert items as unavailable...');
    
    try {
        const foodsSnapshot = await db.collection('foods').get();
        const batch = db.batch();
        
        let updateCount = 0;
        foodsSnapshot.forEach(doc => {
            const food = doc.data();
            // Set Es Teler Durian and Es Teler Es Krim as unavailable (both are desserts)
            if (food.name === 'Es Teler Durian' || food.name === 'Es Teler Es Krim') {
                batch.update(doc.ref, { isAvailable: false });
                console.log(`Setting ${food.name} as unavailable`);
                updateCount++;
            } else {
                // Set all others as available to ensure clean test
                batch.update(doc.ref, { isAvailable: true });
                console.log(`Setting ${food.name} as available`);
            }
        });
        
        await batch.commit();
        console.log(`Successfully updated ${updateCount} dessert items as unavailable`);
        console.log('Test data setup completed - 2 desserts are now unavailable');
        process.exit(0);
    } catch (error) {
        console.error('Error updating availability:', error);
        process.exit(1);
    }
}

setDessertUnavailable();
