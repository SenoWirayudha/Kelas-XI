# Firestore Data Importer (Node.js)

Tool untuk import data sample ke Firebase Firestore menggunakan Node.js dan Firebase Admin SDK.

## 🚀 Setup

### 1. Install Dependencies
```bash
cd firestore-importer
npm install
```

### 2. Firebase Service Account Setup
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Go to **Project Settings** → **Service Accounts**
4. Klik **Generate New Private Key**
5. Download file JSON service account

### 3. Environment Configuration
1. Copy `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` dengan informasi dari service account JSON:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   # ... dst
   ```

## 📋 Usage

### Import Sample Data
```bash
# Via npm script (recommended)
npm run seed

# Via node directly
node index.js seed
```

### Clear All Data
```bash
# Via npm script
npm run clear

# Via node directly  
node index.js clear
```

### Show Help
```bash
node index.js help
```

## 📊 Sample Data Overview

### 👥 Users (5)
- john_doe (Verified ✓)
- sarah_wilson (Verified ✓)
- mike_chen
- emma_garcia (Verified ✓)
- david_kim

### 📸 Posts (6)
- Various content: sunset, coffee, hiking, cooking, books, coding
- Complete with likes, hashtags, timestamps

### 📱 Stories (5)
- Recent stories from all users
- Mixed viewed/unviewed status

### 🔔 Notifications (5)
- Like, comment, follow, mention notifications
- Realistic user interactions

## 🔧 Script Structure

```
firestore-importer/
├── package.json           # Dependencies & scripts
├── firebase-config.js     # Firebase Admin SDK setup
├── sampleData.js         # Sample data definitions
├── seedData.js           # Data import functions
├── clearData.js          # Data clearing functions
├── index.js              # Main CLI interface
├── .env.example          # Environment template
├── .env                  # Your config (create this)
└── README.md             # This file
```

## 🛡️ Security Notes

1. **Never commit `.env` file** - add to `.gitignore`
2. **Keep service account key secure**
3. **Use different projects for dev/prod**
4. **Implement proper Firestore security rules**

## 🔄 Advanced Usage

### Custom Data Import
```javascript
const { db } = require('./firebase-config');

// Custom collection
const customData = [
  { id: 'doc1', field: 'value' }
];

async function seedCustom() {
  const batch = db.batch();
  customData.forEach(item => {
    const ref = db.collection('custom').doc(item.id);
    batch.set(ref, item);
  });
  await batch.commit();
}
```

### Selective Import
```javascript
const { seedUsers, seedPosts } = require('./seedData');

// Import only specific collections
async function customSeed() {
  await seedUsers();
  await seedPosts();
  // Skip stories & notifications
}
```

## 📝 Troubleshooting

### Common Errors

1. **Authentication Error**
   - Check `.env` configuration
   - Verify service account permissions

2. **Permission Denied**
   - Update Firestore security rules
   - Check service account roles

3. **Network Issues**
   - Check internet connection
   - Verify Firebase project status

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* node index.js seed
```

## 🎯 Production Notes

- Remove or secure this tool in production
- Use environment-specific configurations
- Implement proper error handling
- Add data validation before import
- Consider using Cloud Functions for automated seeding

---

**Happy data importing! 🔥📊**
