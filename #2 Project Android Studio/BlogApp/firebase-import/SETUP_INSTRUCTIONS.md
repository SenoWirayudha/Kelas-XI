# 🔧 Firebase Setup Guide

Berdasarkan hasil validation, ada beberapa langkah yang perlu dilakukan di Firebase Console.

## ⚠️ Issues yang Ditemukan:

1. **Cloud Firestore API belum diaktifkan**
2. **Service Account membutuhkan permissions tambahan**

## 🛠️ Langkah-langkah Perbaikan:

### 1. Aktifkan Cloud Firestore API

1. Buka link berikut:
   ```
   https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=blog-app-ee78d
   ```

2. Click **"ENABLE"** untuk mengaktifkan Cloud Firestore API

3. Tunggu beberapa menit untuk propagation

### 2. Setup Firestore Database

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project **blog-app-ee78d**
3. Go to **Firestore Database**
4. Click **"Create database"**
5. Pilih **"Start in test mode"** (untuk development)
6. Pilih location (misalnya: asia-southeast1)

### 3. Update Service Account Permissions

1. Buka [IAM Admin Console](https://console.developers.google.com/iam-admin/iam/project?project=blog-app-ee78d)

2. Cari service account:
   ```
   firebase-adminsdk-fbsvc@blog-app-ee78d.iam.gserviceaccount.com
   ```

3. Click **Edit** (icon pensil)

4. Click **"ADD ANOTHER ROLE"** dan tambahkan roles berikut:
   - **Firebase Admin SDK Administrator Service Agent**
   - **Service Usage Consumer**
   - **Cloud Datastore User**

5. Click **"SAVE"**

### 4. Aktivkan Authentication (Opsional)

Jika ingin test Authentication juga:

1. Go to **Authentication** di Firebase Console
2. Click **"Get started"**
3. Setup sign-in methods yang dibutuhkan

## 🔄 Setelah Setup:

Tunggu 5-10 menit untuk propagation, lalu jalankan:

```bash
npm run validate
```

Jika masih ada error, coba jalankan lagi setelah beberapa menit.

## 🚀 Langkah Selanjutnya:

Setelah validation berhasil:

```bash
# Import sample data
npm run import

# Atau clear data jika perlu
npm run clear
```

## 📞 Troubleshooting:

Jika masih ada masalah setelah 10 menit:

1. **Refresh page** di Firebase Console
2. **Restart terminal** dan coba lagi
3. **Check browser console** untuk error messages
4. **Try incognito mode** jika ada cache issues

---

**Project ID:** blog-app-ee78d  
**Service Account:** firebase-adminsdk-fbsvc@blog-app-ee78d.iam.gserviceaccount.com
