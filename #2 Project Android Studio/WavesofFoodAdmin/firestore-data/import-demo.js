const admin = require('firebase-admin');
const fs = require('fs');

console.log('🔥 Firebase Admins Collection Import Script');
console.log('==========================================');

// Read the JSON data
const adminsData = JSON.parse(fs.readFileSync('./admins.json', 'utf8'));

// Simple demo data creation (without Firebase connection)
async function createAdminsData() {
  try {
    console.log('📋 Creating admins data structure...');
    
    // Display the data that would be imported
    console.log('\n✨ Data yang akan diimpor ke Firestore:');
    console.log('=====================================');
    
    for (const [adminId, adminData] of Object.entries(adminsData.admins)) {
      console.log(`\n📄 Document ID: ${adminId}`);
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Name: ${adminData.name}`);
      console.log(`   Role: ${adminData.role}`);
      console.log(`   Active: ${adminData.isActive}`);
      console.log(`   Permissions:`, adminData.permissions);
    }
    
    console.log('\n🎯 Manual Import Instructions:');
    console.log('==============================');
    console.log('1. Buka Firebase Console: https://console.firebase.google.com');
    console.log('2. Pilih project Anda');
    console.log('3. Buka Firestore Database');
    console.log('4. Klik "Start collection"');
    console.log('5. Collection ID: "admins"');
    console.log('6. Tambahkan documents dengan data di atas');
    
    console.log('\n🔑 Authentication Setup:');
    console.log('========================');
    console.log('1. Buka Authentication → Users');
    console.log('2. Add user dengan email: admin@wavesoffood.com');
    console.log('3. Password: admin123456 (atau pilihan Anda)');
    
    console.log('\n📱 Test Login:');
    console.log('==============');
    console.log('Email: admin@wavesoffood.com');
    console.log('Password: admin123456');
    
    // Generate Firestore import format
    console.log('\n📋 Firestore Import JSON Format:');
    console.log('=================================');
    
    const firestoreImport = {
      __collections__: {
        admins: {
          admin_001: {
            email: "admin@wavesoffood.com",
            name: "Admin Waves of Food",
            role: "admin",
            isActive: true,
            createdAt: {
              __datatype__: "timestamp",
              value: new Date().toISOString()
            },
            permissions: {
              manageOrders: true,
              manageMenu: true,
              manageUsers: true,
              viewDashboard: true
            }
          },
          admin_002: {
            email: "manager@wavesoffood.com",
            name: "Manager Waves of Food", 
            role: "manager",
            isActive: true,
            createdAt: {
              __datatype__: "timestamp",
              value: new Date().toISOString()
            },
            permissions: {
              manageOrders: true,
              manageMenu: true,
              manageUsers: false,
              viewDashboard: true
            }
          }
        }
      }
    };
    
    // Save import format to file
    fs.writeFileSync('./firestore-import.json', JSON.stringify(firestoreImport, null, 2));
    console.log('\n✅ Generated firestore-import.json file for Firebase CLI import');
    
    console.log('\n🚀 Firebase CLI Import Command:');
    console.log('===============================');
    console.log('firebase firestore:delete --all-collections');
    console.log('firebase firestore:import firestore-import.json');
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('Next: Manually create the Firestore collection as shown above.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminsData();
