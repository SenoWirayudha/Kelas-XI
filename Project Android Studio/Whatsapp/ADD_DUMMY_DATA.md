# 📝 Cara Menambahkan Data Dummy ke Firebase Realtime Database

Ada 3 cara untuk menambahkan data dummy:

---

## 🎯 **Cara 1: Manual di Firebase Console (Paling Mudah)**

### **Step by Step:**

1. **Buka Firebase Console**
   - URL: https://console.firebase.google.com/
   - Pilih project "Whatsapp"

2. **Buka Realtime Database**
   - Menu kiri → Build → Realtime Database
   - Klik tab **Data**

3. **Tambah Data Users**

   **3.1. Buat Node Users:**
   - Hover di root database name (whatsapp-xxxxx)
   - Klik icon **+** (plus)
   - Name: `Users`
   - Klik Add

   **3.2. Tambah User Pertama:**
   - Hover di `Users`
   - Klik icon **+**
   - Name: `user1` (ini adalah UID dummy)
   - Klik Add
   
   **3.3. Tambah Data User:**
   - Hover di `user1`
   - Klik icon **+** untuk setiap field:
   
   ```
   uid: "user1"
   username: "John Doe"
   email: "john@example.com"
   status: "online"
   lastSeen: 1729000000000
   profileImage: ""
   ```

   **3.4. Tambah User Kedua (user2):**
   - Ulangi langkah 3.2-3.3:
   ```
   uid: "user2"
   username: "Jane Smith"
   email: "jane@example.com"
   status: "online"
   lastSeen: 1729000000000
   profileImage: ""
   ```

   **3.5. Tambah User Ketiga (user3):**
   ```
   uid: "user3"
   username: "Bob Wilson"
   email: "bob@example.com"
   status: "offline"
   lastSeen: 1728900000000
   profileImage: ""
   ```

4. **Tambah Data Chats**

   **4.1. Buat Node Chats:**
   - Hover di root database
   - Klik icon **+**
   - Name: `Chats`
   - Klik Add

   **4.2. Buat Room Chat:**
   - Hover di `Chats`
   - Klik icon **+**
   - Name: `room_user1_user2` (room ID dummy)
   - Klik Add

   **4.3. Buat Node messages:**
   - Hover di `room_user1_user2`
   - Klik icon **+**
   - Name: `messages`
   - Klik Add

   **4.4. Tambah Pesan:**
   - Hover di `messages`
   - Klik icon **+**
   - Name: `msg1`
   - Klik Add
   
   **4.5. Isi Pesan:**
   ```
   uid: "user1"
   message: "Hello Jane!"
   timestamp: 1729000000000
   ```

   **4.6. Tambah Pesan Kedua:**
   ```
   msg2:
     uid: "user2"
     message: "Hi John! How are you?"
     timestamp: 1729001000000
   ```

---

## 🚀 **Cara 2: Import JSON (Lebih Cepat)**

### **Step 1: Siapkan File JSON**

Buat file `dummy_data.json`:

```json
{
  "Users": {
    "user1": {
      "uid": "user1",
      "username": "John Doe",
      "email": "john@example.com",
      "status": "online",
      "lastSeen": 1729000000000,
      "profileImage": ""
    },
    "user2": {
      "uid": "user2",
      "username": "Jane Smith",
      "email": "jane@example.com",
      "status": "online",
      "lastSeen": 1729000000000,
      "profileImage": ""
    },
    "user3": {
      "uid": "user3",
      "username": "Bob Wilson",
      "email": "bob@example.com",
      "status": "offline",
      "lastSeen": 1728900000000,
      "profileImage": ""
    },
    "user4": {
      "uid": "user4",
      "username": "Alice Cooper",
      "email": "alice@example.com",
      "status": "online",
      "lastSeen": 1729010000000,
      "profileImage": ""
    },
    "user5": {
      "uid": "user5",
      "username": "Charlie Brown",
      "email": "charlie@example.com",
      "status": "offline",
      "lastSeen": 1728800000000,
      "profileImage": ""
    }
  },
  "Chats": {
    "room_user1_user2": {
      "messages": {
        "msg1": {
          "uid": "user1",
          "message": "Hello Jane!",
          "timestamp": 1729000000000
        },
        "msg2": {
          "uid": "user2",
          "message": "Hi John! How are you?",
          "timestamp": 1729001000000
        },
        "msg3": {
          "uid": "user1",
          "message": "I'm good, thanks! How about you?",
          "timestamp": 1729002000000
        },
        "msg4": {
          "uid": "user2",
          "message": "Great! Want to meet tomorrow?",
          "timestamp": 1729003000000
        }
      }
    },
    "room_user1_user3": {
      "messages": {
        "msg1": {
          "uid": "user3",
          "message": "Hey John, are you coming to the meeting?",
          "timestamp": 1728900000000
        },
        "msg2": {
          "uid": "user1",
          "message": "Yes, I'll be there at 10 AM",
          "timestamp": 1728901000000
        }
      }
    },
    "room_user2_user4": {
      "messages": {
        "msg1": {
          "uid": "user4",
          "message": "Jane, did you finish the report?",
          "timestamp": 1729010000000
        },
        "msg2": {
          "uid": "user2",
          "message": "Almost done! Will send it by EOD",
          "timestamp": 1729011000000
        }
      }
    }
  }
}
```

### **Step 2: Import ke Firebase**

1. **Buka Firebase Console → Realtime Database**
2. **Klik icon ⋮ (three dots) di kanan atas**
3. **Pilih "Import JSON"**
4. **Upload file `dummy_data.json`**
5. **Klik "Import"**

✅ Done! Semua data langsung masuk!

---

## 💻 **Cara 3: Via Code Android (Programmatic)**

Buat file helper untuk insert dummy data:

### **File: DummyDataHelper.kt**

```kotlin
package com.komputerkit.whatsapp.utils

import com.google.firebase.database.FirebaseDatabase
import com.komputerkit.whatsapp.models.MessageModel
import com.komputerkit.whatsapp.models.UserModel

object DummyDataHelper {
    
    private val database = FirebaseDatabase.getInstance()
    
    fun insertDummyUsers() {
        val users = listOf(
            UserModel(
                uid = "dummy_user1",
                username = "John Doe",
                email = "john@example.com",
                profileImage = "",
                status = "online",
                lastSeen = System.currentTimeMillis()
            ),
            UserModel(
                uid = "dummy_user2",
                username = "Jane Smith",
                email = "jane@example.com",
                profileImage = "",
                status = "online",
                lastSeen = System.currentTimeMillis()
            ),
            UserModel(
                uid = "dummy_user3",
                username = "Bob Wilson",
                email = "bob@example.com",
                profileImage = "",
                status = "offline",
                lastSeen = System.currentTimeMillis() - 3600000 // 1 jam lalu
            ),
            UserModel(
                uid = "dummy_user4",
                username = "Alice Cooper",
                email = "alice@example.com",
                profileImage = "",
                status = "online",
                lastSeen = System.currentTimeMillis()
            ),
            UserModel(
                uid = "dummy_user5",
                username = "Charlie Brown",
                email = "charlie@example.com",
                profileImage = "",
                status = "offline",
                lastSeen = System.currentTimeMillis() - 86400000 // 1 hari lalu
            )
        )
        
        val usersRef = database.getReference("Users")
        users.forEach { user ->
            usersRef.child(user.uid).setValue(user)
                .addOnSuccessListener {
                    println("✅ User ${user.username} added")
                }
                .addOnFailureListener { e ->
                    println("❌ Failed to add ${user.username}: ${e.message}")
                }
        }
    }
    
    fun insertDummyChats() {
        val chatRooms = mapOf(
            "room_dummy_user1_dummy_user2" to listOf(
                MessageModel(
                    uid = "dummy_user1",
                    message = "Hello Jane!",
                    timestamp = System.currentTimeMillis() - 3600000
                ),
                MessageModel(
                    uid = "dummy_user2",
                    message = "Hi John! How are you?",
                    timestamp = System.currentTimeMillis() - 3000000
                ),
                MessageModel(
                    uid = "dummy_user1",
                    message = "I'm good, thanks! How about you?",
                    timestamp = System.currentTimeMillis() - 2400000
                ),
                MessageModel(
                    uid = "dummy_user2",
                    message = "Great! Want to meet tomorrow?",
                    timestamp = System.currentTimeMillis() - 1800000
                )
            ),
            "room_dummy_user1_dummy_user3" to listOf(
                MessageModel(
                    uid = "dummy_user3",
                    message = "Hey John, are you coming to the meeting?",
                    timestamp = System.currentTimeMillis() - 7200000
                ),
                MessageModel(
                    uid = "dummy_user1",
                    message = "Yes, I'll be there at 10 AM",
                    timestamp = System.currentTimeMillis() - 7000000
                )
            ),
            "room_dummy_user2_dummy_user4" to listOf(
                MessageModel(
                    uid = "dummy_user4",
                    message = "Jane, did you finish the report?",
                    timestamp = System.currentTimeMillis() - 600000
                ),
                MessageModel(
                    uid = "dummy_user2",
                    message = "Almost done! Will send it by EOD",
                    timestamp = System.currentTimeMillis() - 300000
                )
            )
        )
        
        chatRooms.forEach { (roomId, messages) ->
            val roomRef = database.getReference("Chats").child(roomId).child("messages")
            messages.forEach { message ->
                val messageId = roomRef.push().key ?: return@forEach
                roomRef.child(messageId).setValue(message)
                    .addOnSuccessListener {
                        println("✅ Message added to $roomId")
                    }
                    .addOnFailureListener { e ->
                        println("❌ Failed to add message: ${e.message}")
                    }
            }
        }
    }
    
    fun insertAllDummyData() {
        insertDummyUsers()
        // Delay sedikit agar users sudah masuk sebelum chat
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            insertDummyChats()
        }, 2000)
    }
}
```

### **Cara Pakai:**

**Option 1: Di LoginActivity setelah login:**
```kotlin
// Di LoginActivity.kt, tambahkan di onViewCreated atau onCreate
// HANYA UNTUK DEVELOPMENT/TESTING!

// Uncomment untuk insert dummy data (hapus setelah selesai)
// DummyDataHelper.insertAllDummyData()
```

**Option 2: Buat Activity Khusus untuk Admin:**
```kotlin
// Di HomeActivity.kt, tambahkan di menu
override fun onOptionsItemSelected(item: MenuItem): Boolean {
    return when (item.itemId) {
        R.id.action_insert_dummy -> {
            DummyDataHelper.insertAllDummyData()
            Toast.makeText(this, "Inserting dummy data...", Toast.LENGTH_SHORT).show()
            true
        }
        // ... menu lainnya
        else -> super.onOptionsItemSelected(item)
    }
}
```

**Option 3: Debug Button (Recommended untuk Testing):**
```kotlin
// Tambahkan button di activity_home.xml (sementara)
<Button
    android:id="@+id/btnInsertDummy"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="Insert Dummy Data"
    android:visibility="gone"
    tools:visibility="visible" />

// Di HomeActivity.kt
binding.btnInsertDummy.setOnClickListener {
    DummyDataHelper.insertAllDummyData()
    Toast.makeText(this, "Inserting dummy data...", Toast.LENGTH_SHORT).show()
    // Hide button after use
    binding.btnInsertDummy.visibility = View.GONE
}
```

---

## 🎯 **Rekomendasi Saya:**

### **Untuk Testing Cepat:**
✅ **Cara 2 (Import JSON)** - Paling cepat dan bersih

### **Untuk Development:**
✅ **Cara 3 (Via Code)** - Bisa di-trigger kapan saja dengan button

### **Untuk Manual Testing:**
✅ **Cara 1 (Manual Console)** - Bagus untuk memahami struktur data

---

## 📊 **Struktur Data yang Dihasilkan:**

```
Firebase Realtime Database
├── Users/
│   ├── user1/
│   │   ├── uid: "user1"
│   │   ├── username: "John Doe"
│   │   ├── email: "john@example.com"
│   │   ├── status: "online"
│   │   ├── lastSeen: 1729000000000
│   │   └── profileImage: ""
│   ├── user2/
│   │   └── ... (sama seperti user1)
│   └── user3, user4, user5...
│
└── Chats/
    ├── room_user1_user2/
    │   └── messages/
    │       ├── msg1/
    │       │   ├── uid: "user1"
    │       │   ├── message: "Hello Jane!"
    │       │   └── timestamp: 1729000000000
    │       ├── msg2/
    │       │   └── ... (message berikutnya)
    │       └── msg3, msg4...
    │
    ├── room_user1_user3/
    │   └── messages/
    │       └── ... (messages)
    │
    └── room_user2_user4/
        └── messages/
            └── ... (messages)
```

---

## ⚠️ **PENTING: Clean Up Dummy Data**

Setelah selesai testing, **HAPUS DATA DUMMY**:

### **Via Firebase Console:**
1. Buka Realtime Database
2. Hover di node yang ingin dihapus (misal: `user1`)
3. Klik icon **×** (delete)
4. Confirm

### **Via Code:**
```kotlin
// Hapus semua dummy users
val usersRef = FirebaseDatabase.getInstance().getReference("Users")
listOf("dummy_user1", "dummy_user2", "dummy_user3", "dummy_user4", "dummy_user5")
    .forEach { uid ->
        usersRef.child(uid).removeValue()
    }

// Hapus semua dummy chats
val chatsRef = FirebaseDatabase.getInstance().getReference("Chats")
listOf("room_dummy_user1_dummy_user2", "room_dummy_user1_dummy_user3", "room_dummy_user2_dummy_user4")
    .forEach { roomId ->
        chatsRef.child(roomId).removeValue()
    }
```

---

## 🧪 **Testing Setelah Insert Dummy Data**

### **1. Test Load Users di ChatFragment:**
```kotlin
// Di ChatFragment.kt, ganti loadSampleChats() dengan:
private fun loadChatsFromFirebase() {
    val database = FirebaseDatabase.getInstance()
    val usersRef = database.getReference("Users")
    
    usersRef.addValueEventListener(object : ValueEventListener {
        override fun onDataChange(snapshot: DataSnapshot) {
            val chats = mutableListOf<ChatListModel>()
            
            for (userSnapshot in snapshot.children) {
                val user = userSnapshot.getValue(UserModel::class.java) ?: continue
                
                // Skip current user
                if (user.uid == FirebaseAuth.getInstance().currentUser?.uid) continue
                
                chats.add(ChatListModel(
                    chatId = "room_${FirebaseAuth.getInstance().currentUser?.uid}_${user.uid}",
                    userId = user.uid,
                    userName = user.username,
                    lastMessage = "Tap to start chatting",
                    timestamp = user.lastSeen,
                    unreadCount = 0,
                    profileImage = user.profileImage
                ))
            }
            
            chatAdapter.submitList(chats)
            binding.emptyState.visibility = if (chats.isEmpty()) View.VISIBLE else View.GONE
        }
        
        override fun onCancelled(error: DatabaseError) {
            Toast.makeText(context, "Error: ${error.message}", Toast.LENGTH_SHORT).show()
        }
    })
}
```

### **2. Test di MainActivity:**
```kotlin
// Buka chat dengan salah satu dummy user
// Kirim pesan
// Cek di Firebase Console apakah pesan masuk
```

---

## 📝 **Checklist:**

- [ ] Setup Realtime Database di Firebase Console
- [ ] Set Rules untuk test mode
- [ ] Insert dummy users (pilih salah satu cara)
- [ ] Insert dummy chats
- [ ] Verify data di Firebase Console tab Data
- [ ] Test load data di app
- [ ] Test send message
- [ ] Clean up dummy data setelah selesai

---

**Mau pakai cara yang mana? Saya bisa bantu implementasi!** 🚀
