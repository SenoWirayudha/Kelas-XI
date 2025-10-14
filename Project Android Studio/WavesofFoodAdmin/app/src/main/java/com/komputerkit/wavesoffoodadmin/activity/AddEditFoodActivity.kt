package com.komputerkit.wavesoffoodadmin.activity

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.widget.ArrayAdapter
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.google.firebase.storage.FirebaseStorage
import com.komputerkit.wavesoffoodadmin.FirebaseHelper
import com.komputerkit.wavesoffoodadmin.R
import com.komputerkit.wavesoffoodadmin.Utils
import com.komputerkit.wavesoffoodadmin.databinding.ActivityAddEditFoodBinding
import com.komputerkit.wavesoffoodadmin.model.MenuItem
import com.komputerkit.wavesoffoodadmin.repository.FoodRepository
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.UUID

class AddEditFoodActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityAddEditFoodBinding
    private val foodRepository = FoodRepository()
    private var selectedImageUri: Uri? = null
    private var currentFood: MenuItem? = null
    private var isEditMode = false
    
    // Track which image input method was used last
    private var lastImageInputMethod: ImageInputMethod = ImageInputMethod.NONE
    
    enum class ImageInputMethod {
        NONE, URL, LOCAL_UPLOAD
    }
    
    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            selectedImageUri = result.data?.data
            selectedImageUri?.let { uri ->
                binding.ivFoodImage.setImageURI(uri)
                binding.layoutUploadPlaceholder.visibility = View.GONE
                
                // Mark that local upload was chosen (clear URL if any)
                lastImageInputMethod = ImageInputMethod.LOCAL_UPLOAD
                if (binding.etImageUrl.text.toString().isNotEmpty()) {
                    binding.etImageUrl.setText("")
                    Utils.showToast(this@AddEditFoodActivity, "Gambar lokal dipilih, URL dihapus")
                }
                
                android.util.Log.d("AddEditFood", "Local image selected, cleared URL input")
            }
        }
    }
    
    private fun testFirebaseConnection() {
        lifecycleScope.launch {
            try {
                val storage = FirebaseStorage.getInstance()
                val bucket = storage.app.options.storageBucket
                
                if (bucket.isNullOrEmpty()) {
                    android.util.Log.w("AddEditFood", "Firebase Storage tidak dikonfigurasi")
                    
                    // Show info that storage is not configured
                    runOnUiThread {
                        Utils.showToast(this@AddEditFoodActivity, "Firebase Storage belum dikonfigurasi. Menu akan disimpan tanpa gambar.")
                    }
                    return@launch
                }
                
                android.util.Log.d("AddEditFood", "Testing Firebase Storage connection...")
                android.util.Log.d("AddEditFood", "Storage bucket: $bucket")
                
                // Try to get metadata of a non-existent file to test connection
                val testRef = storage.reference.child("test").child("connection_test.txt")
                testRef.metadata.addOnSuccessListener {
                    android.util.Log.d("AddEditFood", "Firebase Storage connection OK")
                }.addOnFailureListener { exception ->
                    android.util.Log.d("AddEditFood", "Firebase Storage connection test completed: ${exception.message}")
                    // This is expected for non-existent file, but confirms connection works
                }
                
            } catch (e: Exception) {
                android.util.Log.e("AddEditFood", "Firebase Storage connection error", e)
                runOnUiThread {
                    Utils.showToast(this@AddEditFoodActivity, "Firebase Storage error: ${e.message}")
                }
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddEditFoodBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Test Firebase connection on startup
        testFirebaseConnection()
        
        setupToolbar()
        setupCategorySpinner()
        setupClickListeners()
        checkEditMode()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }
    
    private fun setupCategorySpinner() {
        lifecycleScope.launch {
            try {
                val categories = foodRepository.getFoodCategories().toMutableList()
                
                // Add common categories if not exists
                val commonCategories = listOf("Nasi", "Mie", "Ayam", "Seafood", "Minuman", "Dessert")
                commonCategories.forEach { category ->
                    if (!categories.contains(category)) {
                        categories.add(category)
                    }
                }
                
                val adapter = ArrayAdapter(this@AddEditFoodActivity, android.R.layout.simple_dropdown_item_1line, categories)
                binding.actvCategory.setAdapter(adapter)
                
            } catch (e: Exception) {
                Utils.showToast(this@AddEditFoodActivity, "Gagal memuat kategori")
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.layoutImageUpload.setOnClickListener {
            openImagePicker()
        }
        
        binding.btnSave.setOnClickListener {
            saveFood()
        }
        
        // Add text change listener for image URL
        binding.etImageUrl.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            
            override fun afterTextChanged(s: android.text.Editable?) {
                val url = s.toString().trim()
                if (url.isNotEmpty() && (url.startsWith("http://") || url.startsWith("https://"))) {
                    // Mark that URL was chosen (clear local selection)
                    lastImageInputMethod = ImageInputMethod.URL
                    if (selectedImageUri != null) {
                        selectedImageUri = null
                        Utils.showToast(this@AddEditFoodActivity, "URL gambar dipilih, upload lokal dibatalkan")
                    }
                    
                    loadImageFromUrl(url)
                    android.util.Log.d("AddEditFood", "URL entered, cleared local image selection")
                } else if (url.isEmpty()) {
                    // URL was cleared, reset to none
                    if (lastImageInputMethod == ImageInputMethod.URL) {
                        lastImageInputMethod = ImageInputMethod.NONE
                    }
                }
            }
        })
    }
    
    private fun loadImageFromUrl(url: String) {
        try {
            // Load image from URL using Glide
            Glide.with(this)
                .load(url)
                .placeholder(R.drawable.ic_launcher_foreground)
                .error(R.drawable.ic_launcher_foreground)
                .into(binding.ivFoodImage)
            
            // Hide placeholder when loading from URL
            binding.layoutUploadPlaceholder.visibility = View.GONE
            
            android.util.Log.d("AddEditFood", "Loading image from URL: $url")
        } catch (e: Exception) {
            android.util.Log.e("AddEditFood", "Error loading image from URL", e)
        }
    }
    
    private fun checkEditMode() {
        val foodId = intent.getStringExtra("food_id")
        if (!foodId.isNullOrEmpty()) {
            isEditMode = true
            binding.toolbar.title = "Edit Menu"
            binding.btnSave.text = "Update Menu"
            loadFoodData(foodId)
        }
    }
    
    private fun loadFoodData(foodId: String) {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val food = foodRepository.getFoodById(foodId)
                if (food != null) {
                    currentFood = food
                    populateFields(food)
                } else {
                    Utils.showToast(this@AddEditFoodActivity, "Menu tidak ditemukan")
                    finish()
                }
            } catch (e: Exception) {
                Utils.showToast(this@AddEditFoodActivity, "Gagal memuat data menu")
                finish()
            } finally {
                showLoading(false)
            }
        }
    }
    
    private fun populateFields(food: MenuItem) {
        binding.apply {
            etFoodName.setText(food.name)
            actvCategory.setText(food.category)
            etDescription.setText(food.description)
            etPrice.setText(food.price.toInt().toString())
            switchAvailable.isChecked = food.isAvailable
            
            // Load existing image and populate URL field
            if (food.imageUrl.isNotEmpty()) {
                etImageUrl.setText(food.imageUrl)
                Glide.with(this@AddEditFoodActivity)
                    .load(food.imageUrl)
                    .placeholder(R.drawable.ic_launcher_foreground)
                    .into(ivFoodImage)
                layoutUploadPlaceholder.visibility = View.GONE
            }
        }
    }
    
    private fun openImagePicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        imagePickerLauncher.launch(Intent.createChooser(intent, "Pilih Gambar"))
    }
    
    private fun saveFood() {
        if (!validateInput()) return
        
        showLoading(true)
        
        // New logic: Check what was chosen last by the user
        when (lastImageInputMethod) {
            ImageInputMethod.URL -> {
                // User chose URL - prioritize URL even if local image exists
                val imageUrl = binding.etImageUrl.text.toString().trim()
                if (imageUrl.isNotEmpty() && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
                    android.util.Log.d("AddEditFood", "Using image URL (user's choice): $imageUrl")
                    saveFoodToFirestore(imageUrl)
                    return
                }
            }
            
            ImageInputMethod.LOCAL_UPLOAD -> {
                // User chose local upload - prioritize local image even if URL exists
                if (selectedImageUri != null) {
                    android.util.Log.i("AddEditFood", "Using Base64 encoding (user's choice)")
                    saveWithBase64Image()
                    return
                }
            }
            
            ImageInputMethod.NONE -> {
                // No specific choice made, use fallback logic
                
                // Fallback 1: Check URL first
                val imageUrl = binding.etImageUrl.text.toString().trim()
                if (imageUrl.isNotEmpty() && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
                    android.util.Log.d("AddEditFood", "Using image URL (fallback): $imageUrl")
                    saveFoodToFirestore(imageUrl)
                    return
                }
                
                // Fallback 2: Check local image
                if (selectedImageUri != null) {
                    android.util.Log.i("AddEditFood", "Using Base64 encoding (fallback)")
                    saveWithBase64Image()
                    return
                }
            }
        }
        
        // Priority 3: Use existing image URL if in edit mode
        if (isEditMode && currentFood?.imageUrl?.isNotEmpty() == true) {
            android.util.Log.d("AddEditFood", "Keeping existing image")
            saveFoodToFirestore(currentFood!!.imageUrl)
            return
        }
        
        // Priority 4: Save without image
        android.util.Log.d("AddEditFood", "Saving without image")
        saveFoodWithoutImage()
    }
    
    private fun validateInput(): Boolean {
        binding.apply {
            val name = etFoodName.text.toString().trim()
            val category = actvCategory.text.toString().trim()
            val description = etDescription.text.toString().trim()
            val priceText = etPrice.text.toString().trim()
            
            if (name.isEmpty()) {
                etFoodName.error = "Nama makanan tidak boleh kosong"
                etFoodName.requestFocus()
                return false
            }
            
            if (category.isEmpty()) {
                actvCategory.error = "Kategori tidak boleh kosong"
                actvCategory.requestFocus()
                return false
            }
            
            if (description.isEmpty()) {
                etDescription.error = "Deskripsi tidak boleh kosong"
                etDescription.requestFocus()
                return false
            }
            
            if (priceText.isEmpty()) {
                etPrice.error = "Harga tidak boleh kosong"
                etPrice.requestFocus()
                return false
            }
            
            try {
                priceText.toDouble()
            } catch (e: NumberFormatException) {
                etPrice.error = "Harga tidak valid"
                etPrice.requestFocus()
                return false
            }
            
            return true
        }
    }
    
    private fun uploadImageAndSaveFood() {
        selectedImageUri?.let { uri ->
            showLoading(true)
            
            try {
                // Check if Firebase Storage is properly initialized
                val storage = FirebaseStorage.getInstance()
                android.util.Log.d("AddEditFood", "Firebase Storage instance: $storage")
                
                // Generate unique filename with timestamp
                val timestamp = System.currentTimeMillis()
                val filename = "food_${timestamp}.jpg"
                
                // Use direct storage reference approach
                val storageRef = storage.reference
                val imageRef = storageRef.child("food_images").child(filename)
                
                android.util.Log.d("AddEditFood", "Uploading to path: ${imageRef.path}")
                android.util.Log.d("AddEditFood", "Storage bucket: ${storage.app.options.storageBucket}")
                
                // Upload with metadata for better compatibility
                val metadata = com.google.firebase.storage.StorageMetadata.Builder()
                    .setContentType("image/jpeg")
                    .build()
                
                val uploadTask = imageRef.putFile(uri, metadata)
                
                uploadTask.addOnProgressListener { taskSnapshot ->
                    val progress = (100.0 * taskSnapshot.bytesTransferred / taskSnapshot.totalByteCount)
                    android.util.Log.d("AddEditFood", "Upload progress: $progress%")
                }
                .addOnSuccessListener { taskSnapshot ->
                    android.util.Log.d("AddEditFood", "Upload successful, getting download URL...")
                    
                    imageRef.downloadUrl.addOnSuccessListener { downloadUrl ->
                        android.util.Log.d("AddEditFood", "Download URL obtained: $downloadUrl")
                        saveFoodToFirestore(downloadUrl.toString())
                    }.addOnFailureListener { exception ->
                        android.util.Log.e("AddEditFood", "Failed to get download URL", exception)
                        showUploadErrorDialog("Gagal mendapatkan URL gambar: ${exception.message}")
                    }
                }
                .addOnFailureListener { exception ->
                    android.util.Log.e("AddEditFood", "Upload failed", exception)
                    showUploadErrorDialog("Gagal mengupload gambar: ${exception.message}")
                }
                
            } catch (e: Exception) {
                android.util.Log.e("AddEditFood", "Error initializing upload", e)
                showUploadErrorDialog("Error sistem: ${e.message}")
            }
        } ?: run {
            // If no image selected, save without image URL
            if (isEditMode && currentFood?.imageUrl?.isNotEmpty() == true) {
                // Keep existing image URL for edit mode
                saveFoodToFirestore(currentFood!!.imageUrl)
            } else {
                showUploadErrorDialog("Silakan pilih gambar terlebih dahulu")
            }
        }
    }
    
    private fun showUploadErrorDialog(message: String) {
        showLoading(false)
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Upload Gambar Gagal")
            .setMessage("$message\n\nPilih opsi:")
            .setPositiveButton("Simpan Tanpa Gambar") { _, _ ->
                showLoading(true)
                saveFoodWithoutImage()
            }
            .setNeutralButton("Coba Upload Ulang") { _, _ ->
                showLoading(true)
                uploadImageAndSaveFood()
            }
            .setNegativeButton("Batal", null)
            .show()
    }
    
    private fun saveFoodWithoutImage() {
        binding.apply {
            val foodId = currentFood?.id ?: UUID.randomUUID().toString()
            
            val food = MenuItem(
                id = foodId,
                name = etFoodName.text.toString().trim(),
                category = actvCategory.text.toString().trim(),
                description = etDescription.text.toString().trim(),
                price = etPrice.text.toString().toDouble(),
                imageUrl = currentFood?.imageUrl ?: "", // Keep existing image or empty
                isAvailable = switchAvailable.isChecked,
                rating = currentFood?.rating ?: 0.0,
                reviewCount = currentFood?.reviewCount ?: 0
            )
            
            lifecycleScope.launch {
                try {
                    val success = if (isEditMode) {
                        foodRepository.updateFood(foodId, food)
                    } else {
                        foodRepository.addFood(food)
                    }
                    
                    if (success) {
                        val message = if (isEditMode) "Menu berhasil diupdate" else "Menu berhasil ditambahkan"
                        Utils.showToast(this@AddEditFoodActivity, message)
                        finish()
                    } else {
                        Utils.showToast(this@AddEditFoodActivity, "Gagal menyimpan menu")
                    }
                } catch (e: Exception) {
                    Utils.showToast(this@AddEditFoodActivity, "Error: ${e.message}")
                } finally {
                    showLoading(false)
                }
            }
        }
    }
    
    private fun saveFoodToFirestore(imageUrl: String) {
        binding.apply {
            val foodId = currentFood?.id ?: UUID.randomUUID().toString()
            
            val food = MenuItem(
                id = foodId,
                name = etFoodName.text.toString().trim(),
                category = actvCategory.text.toString().trim(),
                description = etDescription.text.toString().trim(),
                price = etPrice.text.toString().toDouble(),
                imageUrl = imageUrl,
                isAvailable = switchAvailable.isChecked,
                rating = currentFood?.rating ?: 0.0,
                reviewCount = currentFood?.reviewCount ?: 0
            )
            
            lifecycleScope.launch {
                try {
                    val success = if (isEditMode) {
                        foodRepository.updateFood(foodId, food)
                    } else {
                        foodRepository.addFood(food)
                    }
                    
                    if (success) {
                        val message = if (isEditMode) "Menu berhasil diupdate" else "Menu berhasil ditambahkan"
                        Utils.showToast(this@AddEditFoodActivity, message)
                        finish()
                    } else {
                        Utils.showToast(this@AddEditFoodActivity, "Gagal menyimpan menu")
                    }
                } catch (e: Exception) {
                    Utils.showToast(this@AddEditFoodActivity, "Error: ${e.message}")
                } finally {
                    showLoading(false)
                }
            }
        }
    }
    
    // Convert image URI to Base64 string
    private fun convertImageToBase64(uri: Uri): String? {
        return try {
            val inputStream: InputStream? = contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            
            if (bitmap == null) {
                android.util.Log.e("AddEditFood", "Failed to decode bitmap from URI")
                return null
            }
            
            // Start with conservative resize (max 600px width)
            var maxWidth = 600
            var quality = 70
            var resizedBitmap = resizeImage(bitmap, maxWidth)
            
            var byteArray: ByteArray
            var attempts = 0
            val maxAttempts = 5
            
            do {
                val byteArrayOutputStream = ByteArrayOutputStream()
                resizedBitmap.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream)
                byteArray = byteArrayOutputStream.toByteArray()
                byteArrayOutputStream.close()
                
                android.util.Log.d("AddEditFood", "Attempt ${attempts + 1}: Size ${byteArray.size} bytes, Quality $quality%, Width ${resizedBitmap.width}px")
                
                if (byteArray.size <= 400 * 1024) { // Target 400KB to be safe
                    break
                }
                
                attempts++
                if (attempts < maxAttempts) {
                    // Reduce quality and size progressively
                    quality = maxOf(30, quality - 15)
                    maxWidth = maxOf(300, maxWidth - 100)
                    
                    if (resizedBitmap != bitmap) {
                        resizedBitmap.recycle()
                    }
                    resizedBitmap = resizeImage(bitmap, maxWidth)
                }
                
            } while (attempts < maxAttempts && byteArray.size > 400 * 1024)
            
            // Clean up
            if (resizedBitmap != bitmap) {
                resizedBitmap.recycle()
            }
            bitmap.recycle()
            
            if (byteArray.size > 500 * 1024) {
                android.util.Log.w("AddEditFood", "Image still too large after optimization: ${byteArray.size} bytes")
                return null
            }
            
            android.util.Log.i("AddEditFood", "Successfully converted image to Base64: ${byteArray.size} bytes")
            return "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
            
        } catch (e: Exception) {
            android.util.Log.e("AddEditFood", "Error converting image to Base64", e)
            null
        }
    }
    
    // Resize image to reduce file size
    private fun resizeImage(bitmap: Bitmap, maxWidth: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        if (width <= maxWidth) {
            return bitmap
        }
        
        val aspectRatio = height.toFloat() / width.toFloat()
        val newHeight = (maxWidth * aspectRatio).toInt()
        
        return Bitmap.createScaledBitmap(bitmap, maxWidth, newHeight, true)
    }
    
    // Convert local image to Base64 and save
    private fun saveWithBase64Image() {
        selectedImageUri?.let { uri ->
            showLoading(true)
            
            lifecycleScope.launch {
                try {
                    val base64Image = convertImageToBase64(uri)
                    
                    if (base64Image != null) {
                        saveFoodToFirestore(base64Image)
                    } else {
                        showLoading(false)
                        
                        // Show dialog asking if user wants to save without image
                        androidx.appcompat.app.AlertDialog.Builder(this@AddEditFoodActivity)
                            .setTitle("Gambar Terlalu Besar")
                            .setMessage("Ukuran gambar terlalu besar untuk disimpan. Maksimal 500KB.\n\nApakah ingin menyimpan menu tanpa gambar?")
                            .setPositiveButton("Simpan Tanpa Gambar") { _, _ ->
                                showLoading(true)
                                saveFoodWithoutImage()
                            }
                            .setNegativeButton("Batal", null)
                            .show()
                    }
                } catch (e: Exception) {
                    showLoading(false)
                    Utils.showToast(this@AddEditFoodActivity, "Error memproses gambar: ${e.message}")
                }
            }
        } ?: run {
            saveFoodWithoutImage()
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnSave.isEnabled = !show
    }
}
