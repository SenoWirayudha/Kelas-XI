const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function updateFoodRating() {
    console.log('Updating Es Teler Es Krim rating for testing...');
    
    try {
        const foodsSnapshot = await db.collection('foods').where('name', '==', 'Es Teler Es Krim').get();
        
        if (foodsSnapshot.empty) {
            console.log('Es Teler Es Krim not found');
            process.exit(1);
        }
        
        const foodDoc = foodsSnapshot.docs[0];
        
        await foodDoc.ref.update({
            rating: 4.5,
            reviewCount: 3,
            updatedAt: admin.firestore.Timestamp.now()
        });
        
        console.log('✅ Es Teler Es Krim rating updated to 4.5 stars with 3 reviews');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating food rating:', error);
        process.exit(1);
    }
}

updateFoodRating();
