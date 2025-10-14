const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('🔗 Creating Firestore indexes...');
console.log('');
console.log('📋 Required Index for Comments Query:');
console.log('   Collection: comments');
console.log('   Fields:');
console.log('     - postId (Ascending)');
console.log('     - timestamp (Ascending)');
console.log('');
console.log('🌐 Please create this index manually by visiting:');
console.log('https://console.firebase.google.com/v1/r/project/social-media-app-ad35e/firestore/indexes?create_composite=Cldwcm9qZWN0cy9zb2NpYWwtbWVkaWEtYXBwLWFkMzVlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50cy9pbmRleGVzL18QARoKCgZwb3N0SWQQARoNCgl0aW1lc3RhbXAQARoMCghfX25hbWVfXxAB');
console.log('');
console.log('⏱️  Index creation takes 2-5 minutes to complete.');
console.log('✅ After creation, you can re-enable orderBy in the code.');

process.exit(0);
