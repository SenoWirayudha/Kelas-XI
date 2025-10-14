package com.komputerkit.socialmediaapp.activity

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.activity.StoryEditorActivity
import com.komputerkit.socialmediaapp.databinding.ActivityAddStoryBinding
import com.komputerkit.socialmediaapp.model.Story
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.utils.bitmapToBase64
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.*

class AddStoryActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityAddStoryBinding
    private lateinit var firebaseRepository: FirebaseRepository
    private var selectedImageBitmap: Bitmap? = null
    private var capturedImageUri: Uri? = null
    
    companion object {
        private const val CAMERA_PERMISSION_REQUEST = 100
        private const val STORAGE_PERMISSION_REQUEST = 101
        private const val STORY_EDITOR_REQUEST = 102
    }
    
    // Camera launcher
    private val cameraLauncher = registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success && capturedImageUri != null) {
            Log.d("AddStory", "Camera capture successful")
            loadImageFromUri(capturedImageUri!!)
        } else {
            Log.d("AddStory", "Camera capture failed or cancelled")
        }
    }
    
    // Gallery launcher
    private val galleryLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            Log.d("AddStory", "Gallery image selected: $uri")
            loadImageFromUri(it)
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddStoryBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        firebaseRepository = FirebaseRepository()
        
        setupUI()
    }
    
    private fun setupUI() {
        binding.closeButton.setOnClickListener {
            finish()
        }
        
        binding.cameraButton.setOnClickListener {
            showImageSourceDialog()
        }
        
        binding.addStoryButton.setOnClickListener {
            selectedImageBitmap?.let { bitmap ->
                uploadStory(bitmap)
            } ?: run {
                Toast.makeText(this, "Pilih gambar terlebih dahulu", Toast.LENGTH_SHORT).show()
            }
        }
        
        // Show image source dialog immediately
        showImageSourceDialog()
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == STORY_EDITOR_REQUEST) {
            if (resultCode == RESULT_OK) {
                // Story was uploaded successfully, finish this activity
                val intent = Intent().apply {
                    putExtra("story_uploaded", true)
                }
                setResult(RESULT_OK, intent)
                finish()
            } else {
                // User cancelled or failed, show dialog again
                showImageSourceDialog()
            }
        }
    }
    
    private fun showImageSourceDialog() {
        val options = arrayOf("Ambil Foto", "Pilih dari Galeri")
        
        AlertDialog.Builder(this)
            .setTitle("Pilih Sumber Gambar")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> checkCameraPermissionAndCapture()
                    1 -> checkStoragePermissionAndPick()
                }
            }
            .setOnCancelListener {
                // If user cancels, close activity
                finish()
            }
            .show()
    }
    
    private fun checkCameraPermissionAndCapture() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            captureImage()
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), CAMERA_PERMISSION_REQUEST)
        }
    }
    
    private fun checkStoragePermissionAndPick() {
        // For Android 10+ (API 29+), we can use scoped storage without permission
        // For Android 13+ (API 33+), we need READ_MEDIA_IMAGES
        // For older versions, we need READ_EXTERNAL_STORAGE
        
        when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                // Android 13+ requires READ_MEDIA_IMAGES
                val permission = Manifest.permission.READ_MEDIA_IMAGES
                if (ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED) {
                    pickImageFromGallery()
                } else {
                    ActivityCompat.requestPermissions(this, arrayOf(permission), STORAGE_PERMISSION_REQUEST)
                }
            }
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q -> {
                // Android 10-12 can use scoped storage without permission for ACTION_GET_CONTENT
                pickImageFromGallery()
            }
            else -> {
                // Android 9 and below need READ_EXTERNAL_STORAGE
                val permission = Manifest.permission.READ_EXTERNAL_STORAGE
                if (ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED) {
                    pickImageFromGallery()
                } else {
                    ActivityCompat.requestPermissions(this, arrayOf(permission), STORAGE_PERMISSION_REQUEST)
                }
            }
        }
    }
    
    private fun captureImage() {
        try {
            val imageFile = createImageFile()
            capturedImageUri = FileProvider.getUriForFile(
                this,
                "${packageName}.fileprovider",
                imageFile
            )
            capturedImageUri?.let { uri ->
                cameraLauncher.launch(uri)
            }
        } catch (e: Exception) {
            Log.e("AddStory", "Error creating camera intent", e)
            Toast.makeText(this, "Error opening camera", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun pickImageFromGallery() {
        galleryLauncher.launch("image/*")
    }
    
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "STORY_$timeStamp"
        val storageDir = getExternalFilesDir("Pictures")
        return File.createTempFile(imageFileName, ".jpg", storageDir)
    }
    
    private fun loadImageFromUri(uri: Uri) {
        try {
            val inputStream: InputStream? = contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            
            if (bitmap != null) {
                Log.d("AddStory", "Image loaded successfully, launching editor")
                
                // Launch Story Editor Activity
                val intent = Intent(this, StoryEditorActivity::class.java).apply {
                    putExtra(StoryEditorActivity.EXTRA_IMAGE_URI, uri)
                }
                startActivityForResult(intent, STORY_EDITOR_REQUEST)
            } else {
                Log.e("AddStory", "Failed to decode bitmap from URI")
                Toast.makeText(this, "Failed to load image", Toast.LENGTH_SHORT).show()
            }
            
        } catch (e: Exception) {
            Log.e("AddStory", "Error loading image", e)
            Toast.makeText(this, "Error loading image", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun resizeBitmap(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        // Calculate scaling ratio
        val ratio = minOf(maxWidth.toFloat() / width, maxHeight.toFloat() / height)
        
        if (ratio >= 1) return bitmap // No need to resize
        
        val newWidth = (width * ratio).toInt()
        val newHeight = (height * ratio).toInt()
        
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
    
    /**
     * Resize bitmap to 9:16 aspect ratio (story format)
     * Adds letterbox (black padding) if needed to maintain aspect ratio
     */
    private fun resizeToStoryAspect(bitmap: Bitmap): Bitmap {
        try {
            val originalWidth = bitmap.width
            val originalHeight = bitmap.height
            
            Log.d("AddStory", "Original bitmap size: ${originalWidth}x${originalHeight}")
            
            // Target aspect ratio untuk story (9:16)
            val targetAspectRatio = 9f / 16f // 0.5625
            val currentAspectRatio = originalWidth.toFloat() / originalHeight.toFloat()
            
            Log.d("AddStory", "Current aspect ratio: $currentAspectRatio, Target: $targetAspectRatio")
            
            // Calculate new dimensions untuk maintain 9:16 aspect ratio
            val finalWidth: Int
            val finalHeight: Int
            
            if (currentAspectRatio > targetAspectRatio) {
                // Image terlalu lebar (landscape) - letterbox kiri/kanan
                finalHeight = originalHeight
                finalWidth = (originalHeight * targetAspectRatio).toInt()
                Log.d("AddStory", "Letterboxing horizontal - adding black padding left/right")
            } else {
                // Image terlalu tinggi atau square - letterbox atas/bawah
                finalWidth = originalWidth
                finalHeight = (originalWidth / targetAspectRatio).toInt()
                Log.d("AddStory", "Letterboxing vertical - adding black padding top/bottom")
            }
            
            Log.d("AddStory", "Final size after aspect ratio fix: ${finalWidth}x${finalHeight}")
            
            // Create new bitmap dengan background hitam
            val aspectCorrectedBitmap = Bitmap.createBitmap(
                finalWidth,
                finalHeight,
                Bitmap.Config.ARGB_8888
            )
            
            val canvas = Canvas(aspectCorrectedBitmap)
            
            // Fill dengan background hitam untuk letterbox effect
            canvas.drawColor(Color.BLACK)
            
            // Calculate position untuk center original bitmap
            val left = (finalWidth - originalWidth) / 2f
            val top = (finalHeight - originalHeight) / 2f
            
            Log.d("AddStory", "Centering original bitmap at position: ($left, $top)")
            
            // Draw original bitmap di center dengan letterbox
            canvas.drawBitmap(bitmap, left, top, null)
            
            Log.d("AddStory", "Story aspect ratio bitmap created successfully")
            
            return aspectCorrectedBitmap
            
        } catch (e: Exception) {
            Log.e("AddStory", "Error resizing to story aspect ratio", e)
            // Return original bitmap jika ada error
            return bitmap
        }
    }
    
    private fun uploadStory(bitmap: Bitmap) {
        try {
            binding.addStoryButton.isEnabled = false
            binding.addStoryButton.text = "Uploading..."
            
            // Resize ke aspect ratio 9:16 untuk story format
            val storyBitmap = resizeToStoryAspect(bitmap)
            
            // Get current user data first
            firebaseRepository.getCurrentUser { user ->
                runOnUiThread {
                    try {
                        Log.d("AddStory", "Retrieved user: $user")
                        Log.d("AddStory", "User displayName: ${user?.displayName}")
                        Log.d("AddStory", "User fullName: ${user?.fullName}")
                        Log.d("AddStory", "User username: ${user?.username}")
                        
                        val userName = user?.displayName?.takeIf { it.isNotEmpty() } 
                            ?: user?.fullName?.takeIf { it.isNotEmpty() }
                            ?: user?.username?.takeIf { it.isNotEmpty() }
                            ?: "Unknown User"
                            
                        Log.d("AddStory", "Final userName: $userName")
                        Log.d("AddStory", "Story bitmap size: ${storyBitmap.width}x${storyBitmap.height}")
                        
                        val userProfileImage = user?.profileImageUrl ?: ""
                        
                        // Convert resized bitmap to Base64
                        val base64Image = bitmapToBase64(storyBitmap)
                        
                        // Create story object
                        val story = Story(
                            id = UUID.randomUUID().toString(),
                            userId = firebaseRepository.getCurrentUserId() ?: "anonymous",
                            userName = userName,
                            userProfileImage = userProfileImage,
                            imageUrl = base64Image, // Store Base64 string
                            text = "",
                            timestamp = System.currentTimeMillis(),
                            viewed = false
                        )
                        
                        // Upload to Firebase
                        firebaseRepository.addStory(story) { success ->
                            runOnUiThread {
                                if (success) {
                                    Toast.makeText(this@AddStoryActivity, "Story berhasil diupload!", Toast.LENGTH_SHORT).show()
                                    setResult(Activity.RESULT_OK)
                                    finish()
                                } else {
                                    Toast.makeText(this@AddStoryActivity, "Gagal upload story", Toast.LENGTH_SHORT).show()
                                    binding.addStoryButton.isEnabled = true
                                    binding.addStoryButton.text = "Upload Story"
                                }
                            }
                        }
                        
                    } catch (e: Exception) {
                        Log.e("AddStory", "Error creating story object", e)
                        Toast.makeText(this@AddStoryActivity, "Error creating story", Toast.LENGTH_SHORT).show()
                        binding.addStoryButton.isEnabled = true
                        binding.addStoryButton.text = "Upload Story"
                    }
                }
            }
            
        } catch (e: Exception) {
            Log.e("AddStory", "Error uploading story", e)
            Toast.makeText(this, "Error uploading story", Toast.LENGTH_SHORT).show()
            binding.addStoryButton.isEnabled = true
            binding.addStoryButton.text = "Upload Story"
        }
    }
    
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            CAMERA_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    captureImage()
                } else {
                    Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
            STORAGE_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    pickImageFromGallery()
                } else {
                    Toast.makeText(this, "Storage permission required", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
        }
    }
}
