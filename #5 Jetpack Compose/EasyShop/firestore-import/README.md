# Firestore Data Import Script

Script Node.js untuk mengimport data Products, Categories, dan Banners ke Firebase Firestore.

## 📋 Prerequisites

- Node.js (versi 14 atau lebih baru)
- npm atau yarn
- Firebase project dengan Firestore enabled
- Service Account Key dari Firebase

## 🔑 Setup Service Account Key

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project EasyShop Anda
3. Klik ⚙️ **Project Settings**
4. Tab **Service Accounts**
5. Klik **Generate New Private Key**
6. Download file JSON dan **rename menjadi `serviceAccountKey.json`**
7. Pindahkan file ke folder `firestore-import/`

```
firestore-import/
├── import.js
├── package.json
├── serviceAccountKey.json   ← File ini (jangan di-commit ke Git!)
└── README.md
```

⚠️ **PENTING:** Jangan commit `serviceAccountKey.json` ke Git! File ini berisi kredensial sensitif.

## 📦 Installation

Buka terminal dan jalankan:

```bash
cd firestore-import
npm install
```

Atau dengan yarn:

```bash
cd firestore-import
yarn install
```

## 🚀 Running the Import

Setelah setup selesai, jalankan:

```bash
npm run import
```

Atau langsung:

```bash
node import.js
```

## 📊 Data yang Diimport

### 1. **Categories** (6 dokumen)
- Film
- Buku
- Elektronik
- Fashion
- Makanan
- Olahraga

### 2. **Banners** (4 dokumen)
- Koleksi Film 4K Terbaru
- Buku Pilihan Bulan Ini
- Diskon Akhir Tahun
- Gratis Ongkir Seluruh Indonesia

### 3. **Products** (10 dokumen)

#### Kategori Film (5 produk):
1. Dreams 4K Disc - Rp 450.000 (dari Rp 550.000)
2. Barry Lyndon 4K Disc - Rp 480.000 (dari Rp 600.000)
3. Chungking Express 4K Disc - Rp 420.000 (dari Rp 520.000)
4. Flow 4K Disc - Rp 390.000 (dari Rp 490.000)
5. In the Mood for Love 4K Disc - Rp 460.000 (dari Rp 580.000)

#### Kategori Buku (5 produk):
1. Laut Bercerita - Rp 95.000 (dari Rp 120.000)
2. Seperti Dendam, Rindu Harus Dibayar Tuntas - Rp 85.000 (dari Rp 110.000)
3. Bumi Manusia - Rp 90.000 (dari Rp 115.000)
4. Gadis Kretek - Rp 88.000 (dari Rp 112.000)
5. Namaku Alam - Rp 82.000 (dari Rp 105.000)

## 📝 Data Structure

### ProductModel
```javascript
{
  id: String,           // Unique product ID
  title: String,        // Product name
  description: String,  // Product description
  price: Number,        // Current price (after discount)
  actualPrice: Number,  // Original price
  category: String,     // Category name
  images: [String]      // Array of image URLs
}
```

### CategoryModel
```javascript
{
  id: String,       // Unique category ID
  name: String,     // Category name
  imageUrl: String  // Category image URL
}
```

### BannerModel
```javascript
{
  id: String,       // Unique banner ID
  imageUrl: String, // Banner image URL
  title: String,    // Banner title
  link: String,     // Navigation link
  order: Number     // Display order
}
```

## ✅ Expected Output

```
🚀 Starting Firestore data import...

🔄 Importing categories...
✅ Successfully imported 6 categories
🔄 Importing banners...
✅ Successfully imported 4 banners
🔄 Importing products...
✅ Successfully imported 10 products

🎉 All data imported successfully!

📊 Summary:
   - Categories: 6
   - Banners: 4
   - Products: 10
   - Total documents: 20
```

## 🔍 Verifikasi di Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Klik **Firestore Database**
4. Anda akan melihat 3 collections baru:
   - `categories` (6 documents)
   - `banners` (4 documents)
   - `products` (10 documents)

## 🛠️ Troubleshooting

### Error: Cannot find module 'firebase-admin'
```bash
npm install firebase-admin
```

### Error: ENOENT: no such file or directory 'serviceAccountKey.json'
Pastikan file `serviceAccountKey.json` ada di folder `firestore-import/`

### Error: Permission denied
Service account key mungkin tidak memiliki permission yang cukup. Pastikan role **Cloud Datastore User** atau **Firebase Admin** sudah di-set.

## 🔐 Security Notes

- **JANGAN** commit `serviceAccountKey.json` ke Git
- Tambahkan ke `.gitignore`:
  ```
  firestore-import/serviceAccountKey.json
  ```
- Gunakan environment variables untuk production
- Rotate service account keys secara berkala

## 📞 Support

Jika ada masalah atau pertanyaan, silakan buat issue di repository atau hubungi developer.

---

**Happy Coding! 🚀**
