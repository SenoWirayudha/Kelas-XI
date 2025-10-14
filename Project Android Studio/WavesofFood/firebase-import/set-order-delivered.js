const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function setOrderDelivered() {
    console.log('Finding and updating order to DELIVERED status...');
    
    try {
        const ordersSnapshot = await db.collection('orders').limit(1).get();
        
        if (ordersSnapshot.empty) {
            console.log('No orders found in database');
            process.exit(1);
        }
        
        const orderDoc = ordersSnapshot.docs[0];
        const orderId = orderDoc.id;
        
        await orderDoc.ref.update({
            status: 'DELIVERED',
            updatedAt: admin.firestore.Timestamp.now()
        });
        
        console.log(`✅ Order ${orderId} has been set to DELIVERED status`);
        console.log('You can now test the rating feature!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating order:', error);
        process.exit(1);
    }
}

setOrderDelivered();
