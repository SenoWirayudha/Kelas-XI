// Script untuk mengupdate availability status menu di Firestore
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = require('./service-account-key.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function updateMenuAvailability() {
    try {
        console.log('Updating menu availability status...');
        
        // Get all foods
        const foodsRef = db.collection('foods');
        const snapshot = await foodsRef.get();
        
        console.log(`Found ${snapshot.size} menu items`);
        
        // Update some items to be unavailable for testing
        const batch = db.batch();
        let updateCount = 0;
        let index = 0;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Make specific items unavailable for testing
            if (index === 1 || index === 3 || index === 5) {
                batch.update(doc.ref, { isAvailable: false });
                console.log(`Setting ${data.name} as unavailable`);
                updateCount++;
            } else {
                batch.update(doc.ref, { isAvailable: true });
                console.log(`Setting ${data.name} as available`);
            }
            index++;
        });
        
        await batch.commit();
        console.log(`Successfully updated availability status for all items (${updateCount} set as unavailable)`);
        
    } catch (error) {
        console.error('Error updating menu availability:', error);
    }
}

// Run the update
updateMenuAvailability().then(() => {
    console.log('Availability update completed');
    process.exit(0);
});
