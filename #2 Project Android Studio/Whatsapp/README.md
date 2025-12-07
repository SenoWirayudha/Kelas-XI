# WhatsApp Clone - Aplikasi Chat Real-Time

Aplikasi WhatsApp Clone lengkap dengan fitur authentication dan pengiriman pesan real-time menggunakan Kotlin, Firebase Authentication, dan Firebase Realtime Database.

## ✅ Fitur yang Sudah Diimplementasi

### 🔐 1. **Authentication System**
Sistem login dan register lengkap dengan Firebase Authentication:

#### **Register (Pendaftaran)**
- Input: **Username**, **Email**, **Password**, **Konfirmasi Password**
- Validasi lengkap (format email, password minimal 6 karakter, dll)
- Simpan data user ke Firebase Realtime Database
- Auto login setelah register berhasil

#### **Login (Masuk)**
- Input: **Email**, **Password**
- Auto-check session (jika sudah login, langsung ke MainActivity)
- Fitur **Lupa Password** (reset via email)
- Update status online saat login

#### **Files:**
- `UserModel.kt` - Model data user (uid, username, email, status)
- `LoginActivity.kt` - Activity untuk login
- `RegisterActivity.kt` - Activity untuk register
- `activity_login.xml` - UI login
- `activity_register.xml` - UI register

### 💬 2. **Real-Time Messaging**

#### **MessageModel** (`MessageModel.kt`)
Data class untuk merepresentasikan pesan:
- `uid`: String - ID pengirim pesan
- `message`: String - Isi pesan
- `timestamp`: Long - Waktu pengiriman (milliseconds)

#### **Fungsi sendMessage()** (`MainActivity.kt`)
Fungsi lengkap untuk mengirim pesan dengan langkah-langkah:

##### ✓ Langkah 1: Validasi Input
```kotlin
val messageText = binding.etMessage.text.toString().trim()
if (messageText.isEmpty()) {
    Toast.makeText(this, "Pesan tidak boleh kosong", Toast.LENGTH_SHORT).show()
    return
}
```

##### ✓ Langkah 2: Buat Instance MessageModel
```kotlin
val message = MessageModel(
    uid = senderId,
    message = messageText,
    timestamp = System.currentTimeMillis()
)
```

##### ✓ Langkah 3: Generate Push Key Unik
```kotlin
val messagesRef = database.getReference("Chats")
val pushKey = messagesRef.push().key
```

##### ✓ Langkah 4: Simpan ke Database (Multi-Path Update)
```kotlin
val updates = hashMapOf<String, Any>(
    "Chats/$senderRoom/messages/$pushKey" to message,
    "Chats/$receiverRoom/messages/$pushKey" to message
)
database.reference.updateChildren(updates)
```

##### ✓ Langkah 5: Kosongkan Input Field
```kotlin
binding.etMessage.setText("")
```

#### ✓ Langkah 6: Error Handling
```kotlin
.addOnSuccessListener { /* Success handling */ }
.addOnFailureListener { exception -> /* Error handling */ }
```

## 📁 Struktur Project

```
app/
├── src/main/
│   ├── java/com/komputerkit/whatsapp/
│   │   ├── LoginActivity.kt         # Activity login
│   │   ├── RegisterActivity.kt      # Activity register
│   │   ├── MainActivity.kt          # Activity chat dengan sendMessage()
│   │   ├── UserModel.kt             # Model data user
│   │   ├── MessageModel.kt          # Model data pesan
│   │   └── MainActivityWithListener.kt  # Contoh dengan listener
│   ├── res/
│   │   └── layout/
│   │       ├── activity_login.xml       # UI login
│   │       ├── activity_register.xml    # UI register
│   │       └── activity_main.xml        # UI chat
│   └── AndroidManifest.xml
└── build.gradle.kts                 # Dependencies Firebase
```

## 🔧 Teknologi yang Digunakan

- **Kotlin** - Bahasa pemrograman
- **Firebase Authentication** - System login/register
- **Firebase Realtime Database** - Database real-time
- **View Binding** - Binding view yang type-safe
- **Material Design** - Komponen UI modern

## 🎯 Struktur Database Firebase

```
Chats/
├── user123user456/              # Sender Room
│   └── messages/
│       └── -UniqueKey123/
│           ├── uid: "user123"
│           ├── message: "Hello!"
│           └── timestamp: 1729008000000
└── user456user123/              # Receiver Room
    └── messages/
        └── -UniqueKey123/
            ├── uid: "user123"
            ├── message: "Hello!"
            └── timestamp: 1729008000000
```

## 🚀 Cara Menggunakan

### 1. Setup Firebase
Lihat file `FIREBASE_SETUP.md` untuk panduan lengkap setup Firebase.

### 2. Build & Run
```bash
./gradlew build
./gradlew installDebug
```

### 3. Test Pengiriman Pesan
1. Buka aplikasi
2. Ketik pesan di EditText
3. Klik tombol Send (icon pesawat)
4. Pesan akan terkirim ke Firebase Realtime Database

## 💡 Keunggulan Implementasi

### ✨ Best Practices:
1. **Multi-Path Update**: Menggunakan `updateChildren()` untuk update atomic ke sender dan receiver room secara bersamaan
2. **Error Handling**: Lengkap dengan try-catch dan callback error
3. **Validation**: Validasi input kosong sebelum proses
4. **Logging**: Log untuk debugging (success & error)
5. **User Feedback**: Toast message untuk memberi feedback ke user
6. **Clean Code**: Code terorganisir dengan comments yang jelas

### 🔒 Security Considerations:
- Gunakan Firebase Authentication untuk production
- Implementasi security rules yang ketat
- Validasi data di server-side

## 📝 Variabel yang Sudah Tersedia (Sesuai Requirement)

```kotlin
private lateinit var database: FirebaseDatabase    // ✓ FirebaseDatabase instance
private val senderId: String = "user123"           // ✓ ID pengirim
private val receiverId: String = "user456"         // ✓ ID penerima
private lateinit var binding: ActivityMainBinding  // ✓ Binding object
// binding.etMessage tersedia untuk input pesan     // ✓ EditText
```

## 🎨 UI Components

- **RecyclerView** (`rvMessages`): Untuk menampilkan daftar pesan
- **EditText** (`etMessage`): Input field untuk mengetik pesan
- **FloatingActionButton** (`btnSend`): Tombol untuk mengirim pesan

## 🔄 Flow Pengiriman Pesan

```
User ketik pesan
    ↓
Klik tombol Send
    ↓
Validasi input (tidak boleh kosong)
    ↓
Buat MessageModel dengan timestamp
    ↓
Generate unique push key
    ↓
Simpan ke senderRoom & receiverRoom
    ↓
Kosongkan input field
    ↓
Tampilkan success/error message
```

## 📊 Dependencies yang Ditambahkan

```kotlin
// Firebase BOM (Bill of Materials)
implementation(platform("com.google.firebase:firebase-bom:33.5.1"))

// Firebase Realtime Database
implementation("com.google.firebase:firebase-database-ktx")

// Firebase Authentication (untuk production)
implementation("com.google.firebase:firebase-auth-ktx")
```

## 🐛 Debugging

### Check Logs:
```bash
adb logcat | grep MainActivity
```

### Common Issues:
1. **Pesan tidak terkirim**: Cek koneksi internet dan Firebase rules
2. **App crash**: Pastikan `google-services.json` sudah ada
3. **ViewBinding error**: Clean & rebuild project

## 📈 Next Steps untuk Pengembangan

1. ✅ ~~Implementasi fungsi sendMessage()~~ **SELESAI**
2. 🔄 Tambahkan listener untuk menerima pesan real-time
3. 🔄 Implementasi RecyclerView adapter untuk menampilkan pesan
4. 🔄 Tambahkan Firebase Authentication
5. 🔄 Implementasi online/offline status
6. 🔄 Tambahkan fitur multimedia (gambar, video, audio)
7. 🔄 Implementasi enkripsi end-to-end

## 👨‍💻 Author

Created with ❤️ for learning purposes.

## 📄 License

This project is for educational purposes.
