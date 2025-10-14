const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Sample Users Data
const usersData = [
  {
    id: 'user_ahmad_seno',
    data: {
      name: 'Ahmad Seno Wirayudha',
      email: 'ahmad.seno@example.com',
      profileImageBase64: '',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  },
  {
    id: 'user_budi_santoso',
    data: {
      name: 'Budi Santoso',
      email: 'budi.santoso@example.com',
      profileImageBase64: '',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  },
  {
    id: 'user_siti_aminah',
    data: {
      name: 'Siti Aminah',
      email: 'siti.aminah@example.com',
      profileImageBase64: '',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  },
  {
    id: 'user_andi_pratama',
    data: {
      name: 'Andi Pratama',
      email: 'andi.pratama@example.com',
      profileImageBase64: '',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  },
  {
    id: 'user_dewi_lestari',
    data: {
      name: 'Dewi Lestari',
      email: 'dewi.lestari@example.com',
      profileImageBase64: '',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  }
];

// Sample Posts Data
const postsData = [
  {
    data: {
      title: 'Tips Belajar Android Development untuk Pemula',
      content: `Android development adalah salah satu skill yang sangat dicari di era digital ini. Dalam artikel ini, saya akan membagikan beberapa tips praktis untuk memulai journey sebagai Android developer.

## 1. Pelajari Kotlin sebagai Bahasa Utama
Kotlin adalah bahasa pemrograman modern yang officially recommended oleh Google untuk Android development. Syntax yang lebih concise dan null safety membuatnya lebih aman dibanding Java.

## 2. Pahami Android Architecture Components
- ViewModel untuk manage UI-related data
- LiveData untuk observable data holder
- Room untuk database persistence
- Navigation Component untuk navigasi antar screen

## 3. Praktik dengan Project Sederhana
Mulai dengan project sederhana seperti:
- Calculator app
- To-do list app
- Weather app
- Blog app (seperti yang kita buat ini!)

## 4. Bergabung dengan Komunitas Developer
- Join grup Android Developer Indonesia
- Ikuti Google Developer Groups (GDG)
- Aktif di Stack Overflow dan GitHub
- Attend tech meetups dan conferences

## 5. Terus Update dengan Teknologi Terbaru
- Follow Android Developers Blog
- Subscribe channel YouTube Android Developers
- Ikuti Google I/O dan Android Dev Summit
- Eksplorasi library terbaru seperti Jetpack Compose

Dengan konsisten belajar dan praktik, Anda akan menjadi Android developer yang handal dalam waktu 6-12 bulan!`,
      excerpt: 'Tips praktis untuk memulai belajar Android development dari nol hingga mahir dengan panduan step-by-step.',
      authorId: 'user_ahmad_seno',
      authorName: 'Ahmad Seno Wirayudha',
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T10:30:00Z')),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T10:30:00Z')),
      likeCount: 8,
      likedBy: ['user_budi_santoso', 'user_siti_aminah', 'user_andi_pratama'],
      savedBy: ['user_budi_santoso', 'user_dewi_lestari']
    }
  },
  {
    data: {
      title: 'Mengenal Firebase untuk Mobile App Development',
      content: `Firebase adalah platform Backend-as-a-Service (BaaS) dari Google yang sangat memudahkan developer mobile. Dengan Firebase, kita tidak perlu membuat backend dari scratch dan bisa fokus pada pengembangan aplikasi.

## Layanan Firebase yang Sering Digunakan

### 1. Firebase Authentication
Layanan untuk handle login/register user dengan berbagai provider:
- Email/Password
- Google Sign-In
- Facebook Login
- Phone Authentication
- Anonymous Authentication

### 2. Cloud Firestore
NoSQL document database yang real-time dan scalable:
- Real-time synchronization
- Offline support
- Powerful querying
- Multi-platform SDK

### 3. Cloud Storage
Untuk menyimpan file seperti gambar, video, audio:
- Secure file uploads
- Automatic scaling
- CDN integration
- Image transformation

### 4. Cloud Functions
Server-side logic yang berjalan di cloud:
- Trigger dari database events
- HTTP endpoints
- Scheduled functions
- Background processing

### 5. Firebase Analytics
Untuk tracking user behavior dan app performance:
- User engagement metrics
- Conversion tracking
- Custom events
- Integration dengan Google Ads

## Implementasi dalam Blog App

Dalam tutorial ini, kita menggunakan:
- **Firebase Auth** untuk sistem login/register
- **Cloud Firestore** untuk menyimpan data blog posts dan users
- **Storage** untuk foto profil (via base64 untuk simplicity)

## Keunggulan Firebase
- **Easy Setup**: Setup dalam hitungan menit
- **Real-time**: Data sync otomatis di semua devices
- **Scalable**: Handle jutaan users tanpa masalah
- **Secure**: Built-in security rules
- **Cost-effective**: Pay as you scale

Firebase benar-benar game changer untuk mobile app development!`,
      excerpt: 'Panduan lengkap menggunakan Firebase untuk pengembangan aplikasi mobile modern dengan fitur-fitur canggih.',
      authorId: 'user_budi_santoso',
      authorName: 'Budi Santoso',
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T11:00:00Z')),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T11:00:00Z')),
      likeCount: 12,
      likedBy: ['user_ahmad_seno', 'user_siti_aminah', 'user_andi_pratama', 'user_dewi_lestari'],
      savedBy: ['user_ahmad_seno', 'user_siti_aminah', 'user_dewi_lestari']
    }
  },
  {
    data: {
      title: 'UI/UX Best Practices untuk Mobile App',
      content: `Membuat aplikasi mobile yang user-friendly adalah kunci kesuksesan di App Store dan Play Store. Berikut adalah best practices untuk UI/UX design yang wajib diterapkan:

## 1. Keep It Simple (KISS Principle)
Design yang sederhana lebih mudah dipahami user:
- Gunakan whitespace secara efektif
- Hindari overcrowded layout
- Fokus pada fitur utama
- Minimize cognitive load

## 2. Consistency is Key
Gunakan design pattern yang konsisten:
- Color scheme yang seragam
- Typography hierarchy yang jelas
- Icon style yang konsisten
- Navigation pattern yang predictable

## 3. Mobile-First Approach
Pikirkan pengalaman mobile sejak awal:
- Touch-friendly button size (minimum 44px)
- Thumb-friendly navigation
- Swipe gestures yang intuitif
- Portrait dan landscape orientation

## 4. Performance & Speed
User expect aplikasi yang fast loading:
- Optimize image sizes
- Lazy loading untuk content
- Skeleton screens untuk loading states
- Minimize network requests

## 5. Accessibility (A11y)
Pastikan aplikasi bisa digunakan semua kalangan:
- Color contrast yang cukup (min 4.5:1)
- Text size yang readable
- Screen reader support
- Voice control compatibility

## 6. Visual Hierarchy
Guide user attention dengan:
- Size: Bigger = more important
- Color: Bright colors attract attention
- Position: Top-left gets noticed first
- Typography: Bold for emphasis

## 7. Feedback & States
Berikan feedback untuk setiap user action:
- Loading indicators
- Success/error messages
- Button pressed states
- Form validation feedback

## 8. Navigation Design
- Tab navigation untuk main sections
- Back button yang konsisten
- Breadcrumbs untuk deep navigation
- Search functionality yang mudah diakses

## Tools untuk UI/UX Design
- **Figma**: Collaborative design tool
- **Adobe XD**: Prototyping dan wireframing
- **Sketch**: Mac-exclusive design tool
- **Principle**: Advanced prototyping

Dengan menerapkan prinsip-prinsip ini, aplikasi Anda akan memberikan pengalaman yang luar biasa bagi pengguna dan meningkatkan retention rate significantly!`,
      excerpt: 'Prinsip-prinsip design UI/UX yang wajib diterapkan untuk aplikasi mobile yang sukses dan user-friendly.',
      authorId: 'user_siti_aminah',
      authorName: 'Siti Aminah',
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T12:00:00Z')),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T12:00:00Z')),
      likeCount: 15,
      likedBy: ['user_ahmad_seno', 'user_budi_santoso', 'user_andi_pratama'],
      savedBy: ['user_ahmad_seno', 'user_andi_pratama']
    }
  },
  {
    data: {
      title: 'Kotlin vs Java: Mana yang Lebih Baik untuk Android?',
      content: `Perdebatan antara Kotlin dan Java untuk Android development masih terus berlanjut di kalangan developer. Mari kita bandingkan kedua bahasa ini secara objektif:

## Kotlin Advantages

### 1. Syntax yang Lebih Concise
Kotlin membutuhkan kode yang lebih sedikit untuk fungsi yang sama:

**Java:**
\`\`\`java
public class User {
    private String name;
    private int age;
    
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}
\`\`\`

**Kotlin:**
\`\`\`kotlin
data class User(var name: String, var age: Int)
\`\`\`

### 2. Null Safety Built-in
Kotlin mencegah NullPointerException di compile time:
\`\`\`kotlin
var name: String = "John" // Cannot be null
var nullableName: String? = null // Can be null
\`\`\`

### 3. Interoperability dengan Java
- 100% compatible dengan existing Java code
- Bisa call Java methods dari Kotlin
- Gradual migration dari Java ke Kotlin

### 4. Coroutines untuk Async Programming
\`\`\`kotlin
suspend fun fetchUserData(): User {
    return withContext(Dispatchers.IO) {
        // Network call
        apiService.getUser()
    }
}
\`\`\`

### 5. Smart Casts
\`\`\`kotlin
if (obj is String) {
    // obj is automatically cast to String
    println(obj.length)
}
\`\`\`

## Java Advantages

### 1. Mature Ecosystem
- Huge library ecosystem
- Extensive documentation
- Large community support
- Proven enterprise solutions

### 2. Learning Curve
- Easier untuk beginner programmers
- More verbose tapi lebih explicit
- Familiar syntax untuk C/C++ developers

### 3. Performance
- Slightly better compile time
- Mature JVM optimizations
- Proven performance in production

### 4. Industry Adoption
- Widely used in enterprise
- More job opportunities
- Legacy codebase support

## Kesimpulan & Rekomendasi

### Untuk Project Baru: **Kotlin** 🏆
- Officially preferred oleh Google
- Modern language features
- Better developer experience
- Future-proof choice

### Untuk Legacy Projects: **Java**
- Keep existing Java code
- Gradual migration ke Kotlin
- Team expertise considerations

### Untuk Beginner: **Kotlin**
- Easier to learn modern concepts
- Less boilerplate code
- Google's official recommendation

## Migration Strategy

1. **Start Small**: Convert utility classes first
2. **Feature by Feature**: New features in Kotlin
3. **Test Thoroughly**: Ensure interoperability works
4. **Team Training**: Invest in Kotlin education

Conclusion: Kotlin adalah future of Android development, tapi Java masih relevant untuk maintenance dan legacy projects.`,
      excerpt: 'Perbandingan mendalam antara Kotlin dan Java untuk pengembangan aplikasi Android dengan analisis objektif.',
      authorId: 'user_ahmad_seno',
      authorName: 'Ahmad Seno Wirayudha',
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T13:00:00Z')),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T13:00:00Z')),
      likeCount: 9,
      likedBy: ['user_budi_santoso', 'user_siti_aminah', 'user_dewi_lestari'],
      savedBy: ['user_siti_aminah', 'user_andi_pratama']
    }
  },
  {
    data: {
      title: 'Cara Deploy Android App ke Google Play Store',
      content: `Setelah aplikasi Android selesai dikembangkan, langkah selanjutnya adalah deploy ke Google Play Store. Proses ini memerlukan persiapan yang matang dan pemahaman terhadap kebijakan Google.

## 1. Persiapan APK/AAB

### Generate Signed App Bundle
Google Play Store sekarang merekomendasikan Android App Bundle (AAB):

\`\`\`bash
# Build signed AAB
./gradlew bundleRelease
\`\`\`

### Optimize App Size
- Enable ProGuard/R8 untuk code shrinking
- Optimize image assets (WebP format)
- Remove unused resources
- Use App Bundle untuk dynamic delivery

### Testing Menyeluruh
- Test di berbagai device dan screen sizes
- Test di Android versi minimum hingga terbaru
- Performance testing (memory leaks, battery usage)
- Security testing

## 2. Google Play Console Setup

### Create Developer Account
- Bayar one-time registration fee $25
- Verify identity dengan ID card
- Setup payment profile untuk earnings

### App Information
- **App Title**: Max 50 characters, unique
- **Short Description**: Max 80 characters
- **Full Description**: Max 4000 characters, include keywords
- **App Category**: Pilih yang paling sesuai
- **Content Rating**: Lengkapi questionnaire

### Store Listing Assets
- **App Icon**: 512x512px, PNG format
- **Feature Graphic**: 1024x500px
- **Screenshots**: Min 2, max 8 per device type
- **Promo Video**: YouTube link (optional)

## 3. Release Management

### Internal Testing
- Upload AAB pertama kali
- Add internal testers (max 100)
- Quick testing cycle

### Closed Testing
- Alpha/Beta testing groups
- Feedback collection
- Staged rollout

### Production Release
- Review compliance dengan Play Policy
- Set rollout percentage (start dengan 5-10%)
- Monitor crash reports dan reviews

## 4. App Review Process

### Review Timeline
- First-time submission: 3-7 days
- Updates: 1-3 days
- Policy violations: Up to 7 days untuk appeal

### Common Rejection Reasons
- **Privacy Policy**: Wajib jika collect user data
- **Target API**: Must target recent Android API
- **Permissions**: Justify setiap permission yang diminta
- **Content Policy**: No inappropriate content

### Pre-launch Report
Google akan test aplikasi secara otomatis:
- Crash detection
- Performance issues
- Security vulnerabilities
- Accessibility problems

## 5. Launch Strategy

### Soft Launch
- Release di specific countries dulu
- Monitor metrics dan feedback
- Fix issues sebelum global launch

### ASO (App Store Optimization)
- **Keywords**: Research dan optimize
- **Reviews**: Encourage positive reviews
- **Updates**: Regular updates improve ranking
- **Localization**: Support multiple languages

### Marketing
- **Pre-launch**: Build email list, social media buzz
- **Launch Day**: Press release, social media campaign
- **Post-launch**: Influencer partnerships, ads

## 6. Post-Launch Monitoring

### Key Metrics
- **Downloads**: Track acquisition sources
- **Retention**: Day 1, 7, 30 retention rates
- **Ratings**: Maintain 4.0+ average rating
- **Revenue**: If monetized app

### Crash Reporting
- Setup Firebase Crashlytics
- Monitor ANR (Application Not Responding)
- Fix critical crashes immediately

### User Feedback
- Respond to reviews professionally
- Implement user-requested features
- Regular communication dengan users

## 7. Maintenance & Updates

### Regular Updates
- Bug fixes dan security patches
- New features based on user feedback
- Performance optimizations
- UI/UX improvements

### Policy Compliance
- Stay updated dengan Play Policy changes
- Annual privacy policy review
- Security audit untuk sensitive apps

## Tips untuk Success

1. **Quality First**: Never compromise on app quality
2. **User-Centric**: Always prioritize user experience
3. **Data-Driven**: Make decisions based on analytics
4. **Community**: Build loyal user community
5. **Patience**: Success takes time dan consistency

Dengan mengikuti panduan ini step-by-step, aplikasi Anda akan siap untuk jutaan pengguna Android di seluruh dunia! 🚀`,
      excerpt: 'Panduan lengkap dan detail untuk publish aplikasi Android ke Google Play Store dengan strategi yang proven.',
      authorId: 'user_budi_santoso',
      authorName: 'Budi Santoso',
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T14:00:00Z')),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-25T14:00:00Z')),
      likeCount: 18,
      likedBy: ['user_ahmad_seno', 'user_siti_aminah', 'user_andi_pratama', 'user_dewi_lestari'],
      savedBy: ['user_ahmad_seno', 'user_siti_aminah', 'user_andi_pratama']
    }
  }
];

// Function to import users
async function importUsers() {
  console.log('🔄 Importing users...');
  const batch = db.batch();
  
  usersData.forEach(user => {
    const userRef = db.collection('users').doc(user.id);
    batch.set(userRef, user.data);
  });
  
  await batch.commit();
  console.log('✅ Users imported successfully!');
}

// Function to import posts
async function importPosts() {
  console.log('🔄 Importing posts...');
  const batch = db.batch();
  
  postsData.forEach(post => {
    const postRef = db.collection('posts').doc();
    batch.set(postRef, post.data);
  });
  
  await batch.commit();
  console.log('✅ Posts imported successfully!');
}

// Main import function
async function importAllData() {
  try {
    console.log('🚀 Starting data import to Firestore...');
    console.log(`📁 Project: ${process.env.FIREBASE_PROJECT_ID}`);
    
    await importUsers();
    await importPosts();
    
    console.log('🎉 All data imported successfully!');
    console.log('📊 Summary:');
    console.log(`   • Users: ${usersData.length} documents`);
    console.log(`   • Posts: ${postsData.length} documents`);
    
    // Get collection counts to verify
    const usersSnapshot = await db.collection('users').get();
    const postsSnapshot = await db.collection('posts').get();
    
    console.log('📈 Database verification:');
    console.log(`   • Users in DB: ${usersSnapshot.size} documents`);
    console.log(`   • Posts in DB: ${postsSnapshot.size} documents`);
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the import
importAllData();
