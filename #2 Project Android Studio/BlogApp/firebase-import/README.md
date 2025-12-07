# Firebase Import Tools

Node.js tools untuk mengimpor dan mengelola data sample di Firestore BlogApp.

## 📋 Prerequisites

1. **Node.js** (v16 atau lebih baru)
2. **Firebase Project** yang sudah dibuat
3. **Service Account Key** dari Firebase Console

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd firebase-import
npm install
```

### 2. Setup Environment

```bash
# Copy template ke .env
cp .env.template .env

# Edit .env dengan credentials Firebase Anda
notepad .env  # atau text editor favorit Anda
```

### 3. Dapatkan Service Account Key

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project Anda
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Download file JSON yang dihasilkan
6. Copy values dari JSON file ke `.env` file

### 4. Validate Configuration

```bash
npm run validate
```

### 5. Import Sample Data

```bash
npm run import
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run validate` | Validasi konfigurasi Firebase dan koneksi |
| `npm run import` | Import semua sample data ke Firestore |
| `npm run clear` | Hapus semua data dari Firestore |
| `npm run test` | Alias untuk validate |

## 📊 Sample Data

Script ini akan mengimpor:

- **5 Users** dengan profile lengkap
- **5 Blog Posts** dengan konten realistis tentang Android development
- **Social interactions** (likes, saves) antar users

### Users Sample:
- Ahmad Seno Wirayudha
- Budi Santoso  
- Siti Aminah
- Andi Pratama
- Dewi Lestari

### Blog Posts Sample:
- Tips Belajar Android Development untuk Pemula
- Mengenal Firebase untuk Mobile App Development
- UI/UX Best Practices untuk Mobile App
- Kotlin vs Java: Mana yang Lebih Baik untuk Android?
- Cara Deploy Android App ke Google Play Store

## 🔧 Configuration

### Environment Variables

Buat file `.env` dengan structure berikut:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
```

### Service Account Permissions

Service account memerlukan permissions berikut:
- **Firebase Admin SDK Admin Service Agent**
- **Cloud Datastore User** (untuk Firestore)

## 🛠️ Troubleshooting

### Error: Permission denied

```bash
Error: Permission denied - make sure service account has proper permissions
```

**Solution:** 
1. Check service account permissions di Firebase Console
2. Ensure service account memiliki role **Firebase Admin SDK Admin Service Agent**

### Error: Project not found

```bash
Error: Project not found
```

**Solution:**
1. Verify `FIREBASE_PROJECT_ID` di `.env` file
2. Ensure project exists di Firebase Console

### Error: Invalid private key

```bash
Error: Invalid private key format
```

**Solution:**
1. Check format private key di `.env` file
2. Ensure newlines adalah `\n` dan wrapped dalam quotes
3. Example: `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"`

### Connection timeout

```bash
Error: Connection timeout
```

**Solution:**
1. Check internet connection
2. Verify firewall settings tidak block Firebase APIs
3. Try again setelah beberapa menit

## 📁 File Structure

```
firebase-import/
├── package.json           # Dependencies dan scripts
├── .env.template         # Template untuk environment variables
├── .env                  # Your environment variables (create this)
├── import-data.js        # Main import script
├── clear-data.js         # Data clearing script  
├── validate-config.js    # Configuration validation
└── README.md            # This file
```

## 🔒 Security Notes

- **Never commit** `.env` file ke version control
- **Keep your service account key** secure
- **Rotate keys** secara regular untuk security
- **Use different projects** untuk development dan production

## 🎯 Usage Examples

### Import untuk Development

```bash
# Clear existing data
npm run clear

# Import fresh sample data
npm run import
```

### Validate sebelum Production

```bash
# Always validate before running scripts
npm run validate

# Check output untuk any issues
```

### Batch Operations

```bash
# Clear dan re-import dalam satu langkah
npm run clear && npm run import
```

## 📈 Data Verification

Setelah import, script akan menampilkan:
- ✅ Number of documents imported
- 📊 Database verification counts
- 🎉 Success confirmation

Example output:
```
🎉 All data imported successfully!
📊 Summary:
   • Users: 5 documents
   • Posts: 5 documents
📈 Database verification:
   • Users in DB: 5 documents
   • Posts in DB: 5 documents
```

## 🤝 Contributing

Untuk menambah data sample atau improve scripts:

1. Edit data arrays di `import-data.js`
2. Test dengan `npm run validate`
3. Run import dengan `npm run import`
4. Verify hasil di Firebase Console

## 📞 Support

Jika mengalami issues:

1. Run `npm run validate` untuk diagnostic
2. Check Firebase Console untuk error logs
3. Verify service account permissions
4. Ensure Firestore database sudah dibuat

## 🏆 Best Practices

1. **Always validate** sebelum running scripts
2. **Test di development** environment dulu
3. **Backup data** sebelum clearing production
4. **Monitor Firebase usage** untuk avoid quota limits
5. **Use descriptive commit messages** when modifying scripts

Happy coding! 🚀
