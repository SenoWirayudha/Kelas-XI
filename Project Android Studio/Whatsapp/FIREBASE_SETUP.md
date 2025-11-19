# Setup Firebase untuk Aplikasi WhatsApp

## Langkah-langkah Setup Firebase:

### 1. Setup Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" atau gunakan project yang sudah ada
3. Ikuti wizard untuk membuat project baru
4. Aktifkan Google Analytics (opsional)

### 2. Tambahkan Android App ke Firebase Project
1. Di Firebase Console, klik icon Android
2. Masukkan package name: `com.komputerkit.whatsapp`
3. Masukkan nickname app (opsional): "WhatsApp Clone"
4. Download file `google-services.json`
5. Copy file `google-services.json` ke folder: `app/`

### 3. Aktifkan Firebase Realtime Database
1. Di Firebase Console, pilih menu "Realtime Database"
2. Klik "Create Database"
3. Pilih lokasi database (contoh: asia-southeast1)
4. Pilih mode "Test mode" untuk development (atau "Locked mode" untuk production)
5. Klik "Enable"

### 4. Atur Database Rules (untuk development)
Ubah rules di Firebase Console menjadi:
```json
{
  "rules": {
    "Chats": {
      ".read": true,
      ".write": true
    }
  }
}
```

**PENTING**: Untuk production, gunakan security rules yang lebih ketat:
```json
{
  "rules": {
    "Chats": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['uid', 'message', 'timestamp'])"
          }
        }
      }
    }
  }
}
```

### 5. (Opsional) Setup Firebase Authentication
Untuk production, Anda perlu menggunakan Firebase Authentication:
1. Di Firebase Console, pilih menu "Authentication"
2. Klik "Get Started"
3. Aktifkan metode sign-in yang diinginkan (Email/Password, Google, dll)

## Struktur Database

Database akan memiliki struktur seperti ini:
```
Chats/
  └── {senderRoom}/
      └── messages/
          └── {messageId}/
              ├── uid: "user123"
              ├── message: "Hello!"
              └── timestamp: 1234567890
  └── {receiverRoom}/
      └── messages/
          └── {messageId}/
              ├── uid: "user123"
              ├── message: "Hello!"
              └── timestamp: 1234567890
```

Dimana:
- `{senderRoom}` = senderId + receiverId (contoh: "user123user456")
- `{receiverRoom}` = receiverId + senderId (contoh: "user456user123")
- `{messageId}` = unique key yang di-generate oleh Firebase

## Testing

### Test Manual:
1. Jalankan aplikasi
2. Ketik pesan di EditText
3. Klik tombol Send
4. Cek Firebase Console untuk melihat data yang tersimpan

### Test dengan Dua User:
1. Ubah `senderId` dan `receiverId` di MainActivity.kt
2. Jalankan aplikasi di dua device/emulator berbeda
3. Kirim pesan dari satu device
4. Pesan akan tersimpan di database dan bisa dibaca oleh device lain

## Troubleshooting

### Error: "Default FirebaseApp is not initialized"
- Pastikan file `google-services.json` sudah ada di folder `app/`
- Clean dan rebuild project

### Error: "Permission denied"
- Cek database rules di Firebase Console
- Pastikan rules mengizinkan read/write

### Pesan tidak terkirim
- Cek koneksi internet
- Cek logcat untuk error message
- Pastikan Firebase SDK sudah terupdate

## Next Steps

1. Implementasi Firebase Authentication untuk real user management
2. Tambahkan RecyclerView untuk menampilkan daftar pesan
3. Implementasi ValueEventListener untuk real-time message updates
4. Tambahkan fitur typing indicator
5. Tambahkan fitur online/offline status
6. Implementasi enkripsi end-to-end
