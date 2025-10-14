const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function createTestOrderWithDuplicateItems() {
    console.log('Creating test order with duplicate menu items...');
    
    try {
        // Get a sample user (first user)
        const usersSnapshot = await db.collection('users').limit(1).get();
        if (usersSnapshot.empty) {
            console.log('No users found. Please create a user first.');
            process.exit(1);
        }
        const userId = usersSnapshot.docs[0].id;
        
        // Get Es Teler Es Krim food item
        const foodsSnapshot = await db.collection('foods').where('name', '==', 'Es Teler Es Krim').get();
        if (foodsSnapshot.empty) {
            console.log('Es Teler Es Krim not found');
            process.exit(1);
        }
        const foodDoc = foodsSnapshot.docs[0];
        const food = foodDoc.data();
        
        // Create order with 2 separate Es Teler Es Krim items (simulate adding twice)
        const orderData = {
            userId: userId,
            items: [
                {
                    id: `orderitem_${Date.now()}_1`, // Unique ID for first item
                    foodId: foodDoc.id,
                    name: food.name,
                    price: food.price,
                    quantity: 1,
                    totalPrice: food.price,
                    rating: 0,
                    review: "",
                    hasRated: false
                },
                {
                    id: `orderitem_${Date.now()}_2`, // Unique ID for second item
                    foodId: foodDoc.id,
                    name: food.name,
                    price: food.price,
                    quantity: 1,
                    totalPrice: food.price,
                    rating: 0,
                    review: "",
                    hasRated: false
                }
            ],
            deliveryAddress: {
                fullAddress: "Jl. Test No. 123",
                recipientName: "Test User",
                phone: "081234567890",
                notes: "Test order with duplicate items"
            },
            status: "DELIVERED", // Set to delivered so we can rate it
            subtotal: food.price * 2,
            deliveryFee: 5000,
            total: (food.price * 2) + 5000,
            paymentMethod: "Cash on Delivery",
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
            hasRatedAllItems: false
        };
        
        const orderRef = await db.collection('orders').add(orderData);
        
        console.log(`✅ Test order created with ID: ${orderRef.id}`);
        console.log('📋 Order contains:');
        console.log('   - 1x Es Teler Es Krim (Item #1)');
        console.log('   - 1x Es Teler Es Krim (Item #2)');
        console.log('   - Status: DELIVERED (ready for rating)');
        console.log('\nNow you can test rating each item separately!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test order:', error);
        process.exit(1);
    }
}

createTestOrderWithDuplicateItems();
