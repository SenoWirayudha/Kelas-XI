# Firebase Data Import Script

Script Node.js untuk mengimport data sample ke Firebase Firestore untuk aplikasi WavesofFood.

## Prerequisites

1. **Node.js** (versi 16 atau lebih baru)
2. **Firebase Project** yang sudah dikonfigurasi
3. **Service Account Key** dari Firebase Console

## Setup

### 1. Install Dependencies

```bash
cd firebase-import
npm install
```

### 2. Download Service Account Key

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project `wavesoffood-94471`
3. Masuk ke **Project Settings** > **Service Accounts**
4. Klik **Generate new private key**
5. Simpan file dengan nama `service-account-key.json` di folder `firebase-import`

### 3. Konfigurasi Environment

File `.env` sudah dikonfigurasi dengan:
```
FIREBASE_PROJECT_ID=wavesoffood-94471
FIREBASE_SERVICE_ACCOUNT_KEY=./service-account-key.json
NODE_ENV=development
```

## Usage

### Import Data Sample

```bash
npm start
# atau
npm run import
# atau
node import-data.js
```

### Clear All Data (Opsional)

```bash
node import-data.js clear
```

## Data Structure

Script ini akan mengimport data dengan struktur sebagai berikut:

### Users Collection
- 3 users (2 regular users, 1 admin)
- Termasuk profile lengkap dengan foto

### Foods Collection  
- 8 makanan dari berbagai kategori
- Dengan rating dan review count
- Gambar dari Unsplash

### Orders Collection
- 3 sample orders dengan status berbeda
- Termasuk delivery address dan payment info

### Subcollections
- **users/{userId}/addresses**: Alamat pengiriman
- **users/{userId}/cart**: Keranjang belanja (kosong)
- **foods/{foodId}/reviews**: Review makanan

## Sample Data Overview

### Categories
- Nasi (Nasi Goreng)
- Mie (Mie Ayam Bakso)  
- Ayam (Ayam Bakar Taliwang)
- Sayuran (Gado-Gado)
- Sate (Sate Ayam Madura)
- Minuman (Es Teh, Jus Alpukat)
- Daging (Rendang)

### Order Status
- PENDING: Menunggu konfirmasi
- ON_THE_WAY: Sedang diantar
- DELIVERED: Sudah diterima

### Users
- **john.doe@example.com** (User)
- **jane.smith@example.com** (User)  
- **admin@wavesoffood.com** (Admin)

## Error Handling

Script memiliki error handling untuk:
- Service account key tidak ditemukan
- Kesalahan koneksi Firebase
- Kesalahan import individual data
- Validasi environment variables

## Security Notes

⚠️ **PENTING**: 
- Jangan commit file `service-account-key.json` ke git
- File ini sudah ada di `.gitignore`
- Gunakan hanya untuk development/testing

## Troubleshooting

### Error: Service account key not found
- Pastikan file `service-account-key.json` ada di folder yang benar
- Download ulang dari Firebase Console jika perlu

### Error: Permission denied
- Pastikan service account memiliki role "Editor" atau "Owner"
- Periksa Firestore rules di Firebase Console

### Error: Project not found
- Periksa `FIREBASE_PROJECT_ID` di file `.env`
- Pastikan project ID sesuai dengan Firebase Console

## Log Output

Script akan menampilkan progress import dengan format:
```
🚀 Starting Firebase data import...

📝 Importing users...
  ✅ User imported: John Doe (john.doe@example.com)
  ✅ User imported: Jane Smith (jane.smith@example.com)
  ✅ User imported: Admin User (admin@wavesoffood.com)

📝 Importing addresses...
  ✅ Address imported: Home for user user1
  ✅ Address imported: Office for user user1
  ✅ Address imported: Home for user user2

📝 Importing foods...
  ✅ Food imported: Nasi Goreng Spesial (Nasi)
  ✅ Food imported: Mie Ayam Bakso (Mie)
  ...

🎉 All data imported successfully!
📊 Summary:
   - Users: 3
   - Foods: 8
   - Orders: 3
   - Reviews: 4
   - Addresses: 3
```
