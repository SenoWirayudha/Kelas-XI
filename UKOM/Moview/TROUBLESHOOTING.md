# Troubleshooting Guide - Moview App

## ⚠️ Common Issues & Solutions

### 🔴 Build Issues

#### Issue: "Gradle sync failed"
**Solution:**
```powershell
# Clean dan refresh dependencies
cd "d:\UKOM\Moview"
.\gradlew.bat clean
.\gradlew.bat build --refresh-dependencies
```

#### Issue: "Unresolved reference" errors
**Possible causes:**
1. Gradle sync belum selesai
2. Dependency tidak ter-download

**Solution:**
```
1. File → Invalidate Caches → Invalidate and Restart
2. Build → Clean Project
3. Build → Rebuild Project
```

#### Issue: "Could not find com.android.tools.build:gradle"
**Solution:**
- Check internet connection
- Update `gradle-wrapper.properties`
- Sync gradle files

---

### 🔴 Runtime Issues

#### Issue: App crashes on launch
**Check:**
1. Logcat untuk error message
2. Pastikan min SDK >= 24
3. Permissions di AndroidManifest.xml

**Common causes:**
- ViewBinding not initialized
- Fragment transaction error
- Navigation graph mismatch

**Solution:**
```kotlin
// Make sure MainActivity uses correct binding
binding = ActivityMainBinding.inflate(layoutInflater)
setContentView(binding.root)
```

#### Issue: Bottom Navigation tidak berfungsi
**Check:**
1. nav_graph.xml IDs match menu IDs
2. NavHostFragment ter-setup dengan benar
3. setupWithNavController() dipanggil

**Verify:**
```xml
<!-- menu/bottom_nav_menu.xml -->
<item android:id="@+id/navigation_home" ... />

<!-- navigation/nav_graph.xml -->
<fragment android:id="@+id/navigation_home" ... />
```

#### Issue: RecyclerView tidak muncul
**Checklist:**
- [ ] layoutManager di-set?
- [ ] adapter di-attach?
- [ ] data tidak kosong?
- [ ] layout_height/width correct?

**Solution:**
```kotlin
binding.rvPopularMovies.apply {
    layoutManager = LinearLayoutManager(context, HORIZONTAL, false)
    adapter = yourAdapter
}
```

#### Issue: Images tidak loading
**Check:**
1. Internet permission
2. Emulator/device ada koneksi
3. Glide dependency installed

**Add to AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**Glide basic usage:**
```kotlin
Glide.with(context)
    .load(url)
    .placeholder(R.color.placeholder_color)
    .into(imageView)
```

---

### 🔴 Navigation Issues

#### Issue: Fragment not found
**Error:** `java.lang.IllegalArgumentException: Navigation action/destination cannot be found`

**Solution:**
1. Check nav_graph.xml IDs
2. Verify fragment class names
3. Ensure Navigation dependency added

#### Issue: Back button tidak bekerja
**Solution:**
```kotlin
// Di MainActivity
override fun onSupportNavigateUp(): Boolean {
    return navController.navigateUp() || super.onSupportNavigateUp()
}
```

---

### 🔴 LiveData Issues

#### Issue: Observer tidak triggered
**Common mistakes:**
1. Observe di onCreate instead of onViewCreated (Fragment)
2. Not using viewLifecycleOwner
3. MutableLiveData not updated

**Correct way:**
```kotlin
// Fragment
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    viewModel.data.observe(viewLifecycleOwner) { data ->
        // Update UI
    }
}
```

#### Issue: Memory leak
**Cause:** ViewBinding tidak di-cleanup

**Solution:**
```kotlin
override fun onDestroyView() {
    super.onDestroyView()
    _binding = null  // Important!
}
```

---

### 🔴 ViewBinding Issues

#### Issue: "Unresolved reference: databinding"
**Check:**
1. ViewBinding enabled di build.gradle.kts
2. Layout file exists dan valid XML
3. Clean dan rebuild

**Enable ViewBinding:**
```kotlin
android {
    buildFeatures {
        viewBinding = true
    }
}
```

#### Issue: Binding class not generated
**Solution:**
1. Check XML layout valid
2. Rebuild project
3. Invalidate caches

---

### 🔴 Kotlin Issues

#### Issue: "lateinit property has not been initialized"
**Cause:** Property diakses sebelum initialized

**Solution:**
```kotlin
// Option 1: Check initialization
if (::binding.isInitialized) {
    // Use binding
}

// Option 2: Use nullable with safe call
private var binding: ActivityMainBinding? = null
binding?.someView
```

#### Issue: NullPointerException
**Prevention:**
```kotlin
// Use safe calls
user?.name

// Elvis operator
val name = user?.name ?: "Unknown"

// let function
user?.let { 
    // Use it safely
}
```

---

### 🔴 RecyclerView Issues

#### Issue: Items tidak klik
**Check:**
1. OnClickListener di-set?
2. View clickable/focusable?
3. Parent view mengintercept touch?

**Solution:**
```kotlin
itemView.setOnClickListener {
    onItemClick(item)
}
```

#### Issue: Performance lambat
**Optimizations:**
1. Use ViewHolder pattern ✓
2. Avoid heavy operations in bind
3. Use DiffUtil for updates
4. Set hasFixedSize(true) jika ukuran fixed

```kotlin
recyclerView.setHasFixedSize(true)
```

#### Issue: Nested RecyclerView scroll conflict
**Solution:**
```xml
<androidx.recyclerview.widget.RecyclerView
    android:nestedScrollingEnabled="false"
    ... />
```

---

### 🔴 Glide Issues

#### Issue: OutOfMemoryError dengan images
**Solution:**
```kotlin
Glide.with(context)
    .load(url)
    .override(width, height)  // Resize
    .centerCrop()
    .into(imageView)
```

#### Issue: Image tidak circular
**Solution:**
```kotlin
Glide.with(context)
    .load(url)
    .circleCrop()  // Make it circular
    .into(imageView)
```

---

### 🔴 ViewModel Issues

#### Issue: Data hilang saat rotate
**Cause:** Tidak menggunakan ViewModel

**Solution:**
```kotlin
// Use ViewModel
private val viewModel: HomeViewModel by viewModels()

// Data survive configuration changes
```

#### Issue: ViewModel not shared between Fragments
**Solution:**
```kotlin
// Shared ViewModel
private val sharedViewModel: SharedViewModel by activityViewModels()
```

---

### 🔴 Gradle Issues

#### Issue: Build terlalu lama
**Speed up:**
```kotlin
// gradle.properties
org.gradle.jvmargs=-Xmx2048m
org.gradle.parallel=true
org.gradle.caching=true
kotlin.incremental=true
```

#### Issue: Dependency conflict
**Solution:**
```bash
# Check dependency tree
.\gradlew.bat app:dependencies
```

---

## 🔍 Debugging Tips

### Logcat
```kotlin
import android.util.Log

Log.d("TAG", "Debug message")
Log.e("TAG", "Error message", exception)
```

### Breakpoints
1. Click gutter di line number
2. Run → Debug
3. Step through code

### Layout Inspector
1. Run app di emulator/device
2. Tools → Layout Inspector
3. Inspect view hierarchy

### Android Profiler
1. View → Tool Windows → Profiler
2. Monitor CPU, Memory, Network
3. Identify bottlenecks

---

## 📱 Device Issues

### Emulator lambat
**Solutions:**
1. Enable Hardware Acceleration
2. Increase RAM allocation
3. Use x86 images (faster)
4. Enable "Quick Boot"

### USB Debugging tidak detect
**Solutions:**
1. Enable Developer Options
2. Enable USB Debugging
3. Install proper USB drivers
4. Try different USB cable/port
5. Revoke USB debugging authorizations

---

## 🛠️ Useful Commands

### Gradle
```powershell
# List tasks
.\gradlew.bat tasks

# Build debug
.\gradlew.bat assembleDebug

# Build release
.\gradlew.bat assembleRelease

# Install to device
.\gradlew.bat installDebug

# Uninstall
.\gradlew.bat uninstallDebug

# Clean
.\gradlew.bat clean

# Check dependencies
.\gradlew.bat app:dependencies
```

### ADB
```powershell
# List devices
adb devices

# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Uninstall
adb uninstall com.komputerkit.moview

# Logcat
adb logcat

# Clear logcat
adb logcat -c

# Screen capture
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

---

## 📋 Pre-Launch Checklist

- [ ] No compilation errors
- [ ] No lint warnings (critical)
- [ ] All features tested
- [ ] Memory leaks checked
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Permissions requested properly
- [ ] ProGuard rules (for release)
- [ ] Version code/name updated

---

## 🆘 Getting Help

### Official Resources
- [Android Developer](https://developer.android.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/android)
- [Kotlin Slack](https://kotlinlang.slack.com/)

### Common Error Messages

**"Unable to resolve dependency"**
→ Check internet, sync gradle

**"Manifest merger failed"**
→ Check AndroidManifest.xml conflicts

**"Duplicate class found"**
→ Check for duplicate dependencies

**"NoClassDefFoundError"**
→ Missing dependency or ProGuard issue

**"Resources$NotFoundException"**
→ Resource ID tidak ditemukan, check R file generation

---

## 📞 Project-Specific Issues

### Data tidak muncul di RecyclerView
**Check:**
1. `MovieRepository` returning data?
2. `LiveData` being observed?
3. `Adapter` receiving data?

**Debug:**
```kotlin
viewModel.popularMovies.observe(viewLifecycleOwner) { movies ->
    Log.d("HomeFragment", "Movies received: ${movies.size}")
    // Set adapter
}
```

### BottomNavigation warna tidak benar
**Customize:**
```xml
<!-- res/values/themes.xml -->
<item name="colorPrimary">@color/your_color</item>
```

---

## 🔄 Version Compatibility

### Minimum Versions
- Android Studio: Arctic Fox+
- Gradle: 8.0+
- Kotlin: 1.9.0+
- Java: 11+

### Tested On
- Android 7.0 (API 24) ✓
- Android 14 (API 36) ✓

---

**Remember:** Jika masalah persist, check Logcat untuk detail error message!
