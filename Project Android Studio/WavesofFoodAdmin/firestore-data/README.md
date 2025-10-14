# 🔥 Firebase Admins Collection Import

File-file ini untuk mengimpor collection `admins` ke Firestore database Anda.

## 📂 File yang disediakan:

1. **`admins.json`** - Data admin yang akan diimpor
2. **`import-admins.js`** - Script Node.js untuk import
3. **`import-admins.ps1`** - Script PowerShell untuk Windows
4. **`README.md`** - Panduan ini

## 🚀 Cara Import Collection Admins:

### Metode 1: Manual via Firebase Console (Termudah)

1. **Buka Firebase Console**
   - Kunjungi: https://console.firebase.google.com
   - Pilih project Anda

2. **Buka Firestore Database**
   - Klik "Firestore Database" di sidebar

3. **Buat Collection `admins`**
   - Klik "Start collection"
   - Collection ID: `admins`

4. **Tambah Document Admin**
   - Document ID: `admin_001`
   - Fields:
     ```
     email: "admin@wavesoffood.com" (string)
     name: "Admin Waves of Food" (string)
     role: "admin" (string)
     createdAt: (timestamp) - pilih tanggal hari ini
     isActive: true (boolean)
     ```

5. **Buat User Authentication**
   - Buka tab "Authentication"
   - Klik "Add user"
   - Email: `admin@wavesoffood.com`
   - Password: `admin123456` (atau password pilihan Anda)

### Metode 2: Script Otomatis (Advanced)

1. **Download Service Account Key**
   ```
   1. Firebase Console → Project Settings
   2. Tab "Service accounts"
   3. Click "Generate new private key"
   4. Save as "service-account-key.json" di folder ini
   ```

2. **Install Firebase CLI**
   ```powershell
   npm install -g firebase-tools
   ```

3. **Login ke Firebase**
   ```powershell
   firebase login
   ```

4. **Run Import Script**
   ```powershell
   .\import-admins.ps1
   ```

## 🔑 Default Admin Credentials:

Setelah import berhasil, gunakan credentials ini untuk login:

```
Email: admin@wavesoffood.com
Password: admin123456
```

⚠️ **PENTING:** Ganti password setelah login pertama!

## 📋 Data Admin yang Diimpor:

### Admin Utama
- **Email:** admin@wavesoffood.com
- **Role:** admin
- **Permissions:** Full access (kelola menu, pesanan, pengguna)

### Manager
- **Email:** manager@wavesoffood.com  
- **Role:** manager
- **Permissions:** Kelola menu & pesanan (tidak bisa kelola pengguna)

## 🔧 Troubleshooting:

### Error: "Firebase CLI not found"
```powershell
npm install -g firebase-tools
```

### Error: "Not authenticated"
```powershell
firebase login
firebase use YOUR_PROJECT_ID
```

### Error: "Email already exists"
- User sudah ada di Authentication
- Skip error ini, lanjut saja

## ✅ Verifikasi Import Berhasil:

1. **Cek Firestore Console**
   - Collection `admins` harus ada
   - Document `admin_001` harus terisi

2. **Cek Authentication**
   - User `admin@wavesoffood.com` harus ada

3. **Test Login di App**
   - Build dan run aplikasi Android
   - Login dengan credentials admin
   - Dashboard harus muncul

---

📱 **Setelah import selesai, aplikasi Waves of Food Admin siap digunakan!**
