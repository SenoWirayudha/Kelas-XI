# 🔑 Cara Membuat Firebase Service Account Key

## Langkah 1: Masuk ke Firebase Console

1. **Buka browser** dan pergi ke: https://console.firebase.google.com/
2. **Login** dengan akun Google yang memiliki akses ke project Firebase
3. **Pilih project** `wavesoffood-94471` dari daftar project

## Langkah 2: Masuk ke Project Settings

1. **Klik ikon gear (⚙️)** di sidebar kiri
2. **Pilih "Project settings"** dari dropdown menu

![Firebase Console Settings](https://i.imgur.com/example1.png)

## Langkah 3: Navigate ke Service Accounts

1. **Klik tab "Service accounts"** di bagian atas halaman Project settings
2. Anda akan melihat halaman dengan informasi tentang Admin SDK

## Langkah 4: Generate New Private Key

1. **Scroll ke bawah** sampai Anda melihat section "Admin SDK configuration snippet"
2. **Pastikan language** di dropdown adalah "Node.js"
3. **Klik tombol "Generate new private key"** (warna biru)

![Generate Private Key Button](https://i.imgur.com/example2.png)

## Langkah 5: Konfirmasi Download

1. **Dialog konfirmasi** akan muncul dengan pesan:
   "This will download a new private key. Keep it confidential and never store it in a public repository."
2. **Klik "Generate key"** untuk melanjutkan

## Langkah 6: Save File

1. **File JSON akan otomatis ter-download** dengan nama seperti:
   `wavesoffood-94471-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
2. **Rename file** menjadi: `service-account-key.json`
3. **Move file** ke direktori project:
   ```
   d:\Project Android Studio\WavesofFood\firebase-import\service-account-key.json
   ```

## Langkah 7: Verifikasi File

File `service-account-key.json` harus berisi struktur seperti ini:

```json
{
  "type": "service_account",
  "project_id": "wavesoffood-94471",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@wavesoffood-94471.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Langkah 8: Test Import

Setelah file service account key sudah ada, jalankan:

```bash
cd "d:\Project Android Studio\WavesofFood\firebase-import"
node import-data.js
```

## ⚠️ KEAMANAN PENTING

### ❌ JANGAN LAKUKAN:
- **Jangan commit** file `service-account-key.json` ke Git
- **Jangan share** file ini di public repository
- **Jangan kirim** file via email atau chat

### ✅ LAKUKAN:
- **Simpan file** di local development saja
- **Backup** file di tempat yang aman
- **Regenerate key** jika terkompromis

## 🚨 Troubleshooting

### Error: "Permission denied"
- Pastikan akun Google Anda memiliki role **Editor** atau **Owner** di project Firebase
- Hubungi admin project untuk memberikan akses

### Error: "Project not found"
- Pastikan project ID `wavesoffood-94471` benar
- Cek kembali di Firebase Console

### Error: "Invalid key format"
- Download ulang service account key
- Pastikan file tidak corrupt saat download

### File tidak ter-download
- **Disable popup blocker** di browser
- **Coba browser lain** (Chrome, Firefox, Edge)
- **Check Downloads folder** di komputer

## 📱 Alternative: Mobile Steps

Jika menggunakan tablet/mobile:

1. **Buka Firebase Console** di browser mobile
2. **Request desktop site** di browser settings
3. **Follow langkah yang sama** seperti di atas
4. **Transfer file** ke komputer development

## 🔄 Regenerate Key (Jika Diperlukan)

Jika key hilang atau terkompromisi:

1. **Masuk ke Service Accounts** (langkah 1-3 di atas)
2. **Klik "Generate new private key"** lagi
3. **Key lama otomatis invalid** setelah yang baru dibuat
4. **Update file** di project dengan key yang baru

## ✅ Verification

Untuk memastikan key bekerja, coba jalankan:

```bash
node -e "console.log('Testing key...'); const admin = require('firebase-admin'); const serviceAccount = require('./service-account-key.json'); admin.initializeApp({credential: admin.credential.cert(serviceAccount)}); console.log('✅ Key valid!');"
```

---

**💡 Tips:** Simpan screenshot atau bookmark halaman Service Accounts untuk akses cepat di masa mendatang.
