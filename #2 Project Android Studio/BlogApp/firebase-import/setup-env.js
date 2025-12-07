const fs = require('fs');
const path = require('path');

// Read the service account JSON file
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ service-account-key.json not found!');
  console.log('📝 Please download your service account key from Firebase Console and save it as service-account-key.json');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  // Create .env content
  const envContent = `# Firebase Project Configuration
FIREBASE_PROJECT_ID=${serviceAccount.project_id}

# Service Account Key Fields
FIREBASE_PRIVATE_KEY_ID=${serviceAccount.private_key_id}
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"
FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}
FIREBASE_CLIENT_ID=${serviceAccount.client_id}
FIREBASE_AUTH_URI=${serviceAccount.auth_uri}
FIREBASE_TOKEN_URI=${serviceAccount.token_uri}
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${serviceAccount.auth_provider_x509_cert_url}
FIREBASE_CLIENT_X509_CERT_URL=${serviceAccount.client_x509_cert_url}
`;

  // Write .env file
  fs.writeFileSync('.env', envContent);
  
  console.log('✅ Successfully created .env file from service-account-key.json');
  console.log(`📁 Project ID: ${serviceAccount.project_id}`);
  console.log(`📧 Service Account: ${serviceAccount.client_email}`);
  console.log('');
  console.log('🚀 You can now run:');
  console.log('   npm run validate - to test configuration');
  console.log('   npm run import - to import sample data');
  
} catch (error) {
  console.log('❌ Error reading service-account-key.json:', error.message);
  console.log('📝 Please make sure the file contains valid JSON');
}
