const admin = require('firebase-admin');

// Test simple connection
try {
  const serviceAccount = require('./service-account-key.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully!');
  console.log('📤 Attempting to create admin document...');
  
  const db = admin.firestore();
  
  // Simple admin data
  const adminData = {
    email: "admin@wavesoffood.com",
    name: "Admin Waves of Food",
    role: "admin",
    isActive: true,
    createdAt: admin.firestore.Timestamp.now(),
    permissions: {
      manageOrders: true,
      manageMenu: true,
      manageUsers: true,
      viewDashboard: true
    }
  };
  
  // Create admin document
  db.collection('admins').doc('admin_001').set(adminData)
    .then(() => {
      console.log('🎉 SUCCESS! Admin document created successfully!');
      console.log('✅ Collection: admins');
      console.log('✅ Document: admin_001');
      console.log('✅ Email:', adminData.email);
      console.log('');
      console.log('🔑 NEXT: Create Authentication User');
      console.log('===================================');
      console.log('Firebase Console → Authentication → Add user');
      console.log('Email: admin@wavesoffood.com');
      console.log('Password: admin123456');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error creating admin:', error);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('💡 Service account key not found!');
    console.log('Make sure "service-account-key.json" exists in this folder');
  }
}
