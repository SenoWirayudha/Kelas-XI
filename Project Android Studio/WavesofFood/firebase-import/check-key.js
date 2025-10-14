const fs = require('fs');
const path = require('path');

console.log('🔍 Firebase Service Account Key Checker\n');
console.log('='.repeat(50));

const keyPath = './service-account-key.json';

// Check if file exists
if (!fs.existsSync(keyPath)) {
    console.log('❌ Service account key file NOT FOUND');
    console.log('📍 Expected location:', path.resolve(keyPath));
    console.log('\n📋 To create service account key:');
    console.log('1. Open: https://console.firebase.google.com/');
    console.log('2. Select project: wavesoffood-94471');
    console.log('3. Go to: Project Settings > Service Accounts');
    console.log('4. Click: "Generate new private key"');
    console.log('5. Save as: service-account-key.json');
    console.log('6. Place in: firebase-import/ directory');
    console.log('\n📖 See: HOW-TO-CREATE-SERVICE-ACCOUNT-KEY.md for detailed steps');
    process.exit(1);
}

console.log('✅ Service account key file found');

// Validate file content
try {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    const keyData = JSON.parse(keyContent);
    
    console.log('✅ File is valid JSON');
    
    // Check required fields
    const requiredFields = [
        'type',
        'project_id', 
        'private_key',
        'client_email'
    ];
    
    const missingFields = [];
    requiredFields.forEach(field => {
        if (!keyData[field]) {
            missingFields.push(field);
        }
    });
    
    if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields.join(', '));
        process.exit(1);
    }
    
    console.log('✅ All required fields present');
    
    // Validate project ID
    if (keyData.project_id !== 'wavesoffood-94471') {
        console.log('⚠️  WARNING: Project ID mismatch');
        console.log('   Expected: wavesoffood-94471');
        console.log('   Found:', keyData.project_id);
        console.log('   Make sure you downloaded key from correct project!');
    } else {
        console.log('✅ Project ID matches: wavesoffood-94471');
    }
    
    // Validate service account type
    if (keyData.type !== 'service_account') {
        console.log('❌ Invalid key type:', keyData.type);
        console.log('   Expected: service_account');
        process.exit(1);
    }
    
    console.log('✅ Service account type valid');
    
    // Show key info
    console.log('\n📋 Key Information:');
    console.log('   Project ID:', keyData.project_id);
    console.log('   Client Email:', keyData.client_email);
    console.log('   Private Key ID:', keyData.private_key_id ? keyData.private_key_id.substring(0, 10) + '...' : 'Missing');
    
    // Test Firebase Admin initialization
    console.log('\n🧪 Testing Firebase Admin SDK...');
    
    const admin = require('firebase-admin');
    
    // Initialize Firebase Admin
    admin.initializeApp({
        credential: admin.credential.cert(keyData),
        projectId: keyData.project_id
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Test Firestore connection
    const db = admin.firestore();
    console.log('✅ Firestore connection established');
    
    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('🚀 Your service account key is ready for import');
    console.log('\n📜 Next steps:');
    console.log('   Run: npm start');
    console.log('   Or:  node import-data.js');
    
} catch (error) {
    if (error.code === 'ENOENT') {
        console.log('❌ File not found:', keyPath);
    } else if (error instanceof SyntaxError) {
        console.log('❌ Invalid JSON format');
        console.log('   Error:', error.message);
        console.log('   Please re-download the service account key');
    } else {
        console.log('❌ Error validating key:', error.message);
        
        if (error.message.includes('Project')) {
            console.log('\n🔧 Possible solutions:');
            console.log('1. Check project ID in Firebase Console');
            console.log('2. Make sure you have permission to access the project');
            console.log('3. Try regenerating the service account key');
        }
    }
    process.exit(1);
}
