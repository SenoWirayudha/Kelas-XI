const admin = require('firebase-admin');

console.log('🎯 CREATING DUMMY DATA FOR TESTING');
console.log('==================================');

// Initialize Firebase
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Dummy users data
const dummyUsers = [
  {
    id: 'user_001',
    data: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+6281234567890',
      profileImage: 'https://via.placeholder.com/150',
      address: 'Jl. Sudirman No. 123, Jakarta',
      createdAt: admin.firestore.Timestamp.now(),
      orders: []
    }
  },
  {
    id: 'user_002', 
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+6281234567891',
      profileImage: 'https://via.placeholder.com/150',
      address: 'Jl. Thamrin No. 456, Jakarta',
      createdAt: admin.firestore.Timestamp.now(),
      orders: []
    }
  },
  {
    id: 'user_003',
    data: {
      name: 'Ahmad Rahman',
      email: 'ahmad.rahman@email.com', 
      phone: '+6281234567892',
      profileImage: 'https://via.placeholder.com/150',
      address: 'Jl. Gatot Subroto No. 789, Jakarta',
      createdAt: admin.firestore.Timestamp.now(),
      orders: []
    }
  }
];

// Dummy orders data
const dummyOrders = [
  {
    id: 'order_001',
    data: {
      userId: 'user_001',
      customerName: 'John Doe',
      customerPhone: '+6281234567890',
      customerEmail: 'john.doe@email.com',
      deliveryAddress: 'Jl. Sudirman No. 123, Jakarta',
      items: [
        {
          foodId: 'food1',
          name: 'Nasi Goreng Spesial',
          price: 25000,
          quantity: 2,
          subtotal: 50000
        },
        {
          foodId: 'food2', 
          name: 'Es Teh Manis',
          price: 5000,
          quantity: 2,
          subtotal: 10000
        }
      ],
      totalAmount: 60000,
      status: 'pending',
      orderTime: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      notes: 'Pedas sedang'
    }
  },
  {
    id: 'order_002',
    data: {
      userId: 'user_002',
      customerName: 'Jane Smith', 
      customerPhone: '+6281234567891',
      customerEmail: 'jane.smith@email.com',
      deliveryAddress: 'Jl. Thamrin No. 456, Jakarta',
      items: [
        {
          foodId: 'food3',
          name: 'Ayam Bakar',
          price: 35000,
          quantity: 1,
          subtotal: 35000
        }
      ],
      totalAmount: 35000,
      status: 'preparing',
      orderTime: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      notes: 'Tidak pedas'
    }
  },
  {
    id: 'order_003', 
    data: {
      userId: 'user_003',
      customerName: 'Ahmad Rahman',
      customerPhone: '+6281234567892',
      customerEmail: 'ahmad.rahman@email.com',
      deliveryAddress: 'Jl. Gatot Subroto No. 789, Jakarta',
      items: [
        {
          foodId: 'food4',
          name: 'Gado-gado',
          price: 20000,
          quantity: 1,
          subtotal: 20000
        },
        {
          foodId: 'food5',
          name: 'Jus Jeruk',
          price: 8000,
          quantity: 1,
          subtotal: 8000
        }
      ],
      totalAmount: 28000,
      status: 'ready',
      orderTime: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      notes: ''
    }
  }
];

async function createDummyData() {
  try {
    console.log('👥 Creating dummy users...');
    
    for (const user of dummyUsers) {
      await db.collection('users').doc(user.id).set(user.data);
      console.log(`✅ Created user: ${user.data.name}`);
    }
    
    console.log('\n📦 Creating dummy orders...');
    
    for (const order of dummyOrders) {
      await db.collection('orders').doc(order.id).set(order.data);
      console.log(`✅ Created order: ${order.id} - ${order.data.customerName}`);
    }
    
    console.log('\n🎉 DUMMY DATA CREATED SUCCESSFULLY!');
    console.log('===================================');
    console.log(`✅ ${dummyUsers.length} users created`);
    console.log(`✅ ${dummyOrders.length} orders created`);
    console.log('');
    console.log('📱 TEST APLIKASI SEKARANG:');
    console.log('=========================');
    console.log('1. Buka aplikasi admin');
    console.log('2. Login dengan admin@wavesoffood.com');
    console.log('3. Kelola Pengguna → harus ada 3 users');
    console.log('4. Kelola Pesanan → harus ada 3 orders');
    console.log('');
    console.log('🔧 STATUS ORDERS:');
    console.log('=================');
    console.log('• Order 1: pending (John Doe)');
    console.log('• Order 2: preparing (Jane Smith)');
    console.log('• Order 3: ready (Ahmad Rahman)');
    
  } catch (error) {
    console.error('❌ Error creating dummy data:', error.message);
  }
}

createDummyData();
