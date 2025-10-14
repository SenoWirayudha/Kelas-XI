package com.komputerkit.socialmediaapp.activity

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AlertDialog
import com.bumptech.glide.Glide
import com.google.firebase.storage.FirebaseStorage
import com.komputerkit.socialmediaapp.databinding.ActivityCreatePostBinding
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.util.MediaToBase64Util
import com.komputerkit.socialmediaapp.util.MediaLoaderUtil
import com.komputerkit.socialmediaapp.util.HashtagUtil
import java.util.*

class CreatePostActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCreatePostBinding
    private lateinit var firebaseRepository: FirebaseRepository
    
    private var selectedMediaUri: Uri? = null
    private var selectedMediaType: String = "" // "image" or "video"
    
    private var currentUserId: String = ""
    private var currentUserName: String = ""
    private var currentUserProfileImage: String = ""

    // Launcher untuk memilih image
    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            selectedMediaUri = result.data?.data
            selectedMediaType = "image"
            selectedMediaUri?.let { uri ->
                displaySelectedMedia(uri, "image")
            }
        }
    }
    
    // Launcher untuk memilih video
    private val videoPickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            selectedMediaUri = result.data?.data
            selectedMediaType = "video"
            selectedMediaUri?.let { uri ->
                displaySelectedMedia(uri, "video")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCreatePostBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupClickListeners()
    }

    private fun setupUI() {
        firebaseRepository = FirebaseRepository()
        
        // Get current user info
        currentUserId = firebaseRepository.getCurrentUserId() ?: ""
        if (currentUserId.isEmpty()) {
            showToast("Please login first")
            finish()
            return
        }
        
        // Load current user data
        firebaseRepository.getUserById(currentUserId) { user ->
            user?.let {
                currentUserName = it.username
                currentUserProfileImage = it.profileImageUrl
            }
        }
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        // Initially hide media preview
        binding.postImagePreview.visibility = View.GONE
        binding.postVideoPreview.visibility = View.GONE
    }

    private fun setupClickListeners() {
        // Show media selection dialog
        binding.selectImageButton.setOnClickListener {
            showMediaSelectionDialog()
        }

        binding.postImagePreview.setOnClickListener {
            if (selectedMediaUri == null) {
                showMediaSelectionDialog()
            }
        }
        
        binding.postVideoPreview.setOnClickListener {
            if (selectedMediaUri == null) {
                showMediaSelectionDialog()
            }
        }

        binding.shareButton.setOnClickListener {
            if (validatePost()) {
                uploadPost()
            }
        }
    }
    
    private fun showMediaSelectionDialog() {
        val options = arrayOf("Select Image", "Select Video", "Cancel")
        
        AlertDialog.Builder(this)
            .setTitle("Select Media Type")
            .setItems(options) { dialog, which ->
                when (which) {
                    0 -> openImagePicker()
                    1 -> openVideoPicker()
                    2 -> dialog.dismiss()
                }
            }
            .show()
    }

    private fun openImagePicker() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        imagePickerLauncher.launch(intent)
    }
    
    private fun openVideoPicker() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
        videoPickerLauncher.launch(intent)
    }

    private fun displaySelectedMedia(uri: Uri, mediaType: String) {
        // Hide select button and show appropriate preview
        binding.selectImageButton.visibility = View.GONE
        binding.selectImageText.visibility = View.GONE
        
        when (mediaType) {
            "image" -> {
                binding.postImagePreview.visibility = View.VISIBLE
                binding.postVideoPreview.visibility = View.GONE
                
                // Load image preview
                Glide.with(this)
                    .load(uri)
                    .centerCrop()
                    .into(binding.postImagePreview)
            }
            "video" -> {
                binding.postImagePreview.visibility = View.GONE
                binding.postVideoPreview.visibility = View.VISIBLE
                
                // Set video URI for preview
                binding.postVideoPreview.setVideoURI(uri)
                binding.postVideoPreview.setOnPreparedListener { mediaPlayer ->
                    mediaPlayer.isLooping = true
                    mediaPlayer.setVideoScalingMode(android.media.MediaPlayer.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING)
                }
                binding.postVideoPreview.start()
            }
        }
    }

    private fun validatePost(): Boolean {
        if (selectedMediaUri == null) {
            showToast("Please select an image or video")
            return false
        }

        val description = binding.descriptionEditText.text.toString().trim()
        if (description.isEmpty()) {
            showToast("Please add a description")
            return false
        }

        return true
    }

    private fun uploadPost() {
        selectedMediaUri?.let { uri ->
            showLoading(true)
            
            // Always use base64 encoding
            uploadWithBase64(uri)
        }
    }
    
    private fun uploadWithBase64(uri: Uri) {
        // Convert media to base64 in background thread
        Thread {
            try {
                when (selectedMediaType) {
                    "image" -> {
                        val base64String = MediaToBase64Util.imageUriToBase64(
                            context = this,
                            imageUri = uri,
                            maxWidth = 1024,
                            maxHeight = 1024,
                            quality = 80
                        )
                        
                        if (base64String != null) {
                            runOnUiThread {
                                createPostWithBase64(base64String, "image")
                            }
                        } else {
                            runOnUiThread {
                                showLoading(false)
                                showToast("Failed to process image")
                            }
                        }
                    }
                    "video" -> {
                        val base64String = MediaToBase64Util.videoUriToBase64(
                            context = this,
                            videoUri = uri,
                            maxSizeMB = 1
                        )
                        
                        if (base64String != null) {
                            runOnUiThread {
                                createPostWithBase64(base64String, "video")
                            }
                        } else {
                            runOnUiThread {
                                showLoading(false)
                                showToast("Video too large! Please use videos under 700KB for best results")
                            }
                        }
                    }
                    else -> {
                        runOnUiThread {
                            showLoading(false)
                            showToast("Invalid media type")
                        }
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    showLoading(false)
                    showToast("Error processing media: ${e.message}")
                }
            }
        }.start()
    }
    
    private fun createPostWithBase64(base64Data: String, mediaType: String) {
        val description = binding.descriptionEditText.text.toString().trim()
        val hashtags = HashtagUtil.extractHashtagsList(description)
        
        Log.d("CreatePostActivity", "Creating post with description: '$description'")
        Log.d("CreatePostActivity", "Extracted hashtags: $hashtags")
        Log.d("CreatePostActivity", "Media type: $mediaType")
        Log.d("CreatePostActivity", "Base64 data size: ${base64Data.length} characters")
        
        // Check if base64 data size might be problematic for Firestore
        val estimatedDocSize = base64Data.length + description.length + 500 // Add overhead for other fields
        Log.d("CreatePostActivity", "Estimated Firestore document size: $estimatedDocSize bytes")
        
        if (estimatedDocSize > 1024 * 1024) {
            Log.w("CreatePostActivity", "Document size might exceed Firestore 1MB limit!")
            runOnUiThread {
                showLoading(false)
                showToast("Media file too large for Firestore storage")
            }
            return
        }
        
        val post = Post(
            userId = currentUserId,
            userName = currentUserName,
            userProfileImage = currentUserProfileImage,
            postImageUrl = "", // Legacy field, keep empty for base64
            imageUrl = if (mediaType == "image") base64Data else "",
            videoUrl = if (mediaType == "video") base64Data else "",
            mediaType = mediaType,
            description = description,
            timestamp = System.currentTimeMillis(),
            hashtags = hashtags
        )

        Log.d("CreatePostActivity", "Post object created with hashtags: ${post.hashtags}")
        
        firebaseRepository.addPost(post) { success ->
            runOnUiThread {
                showLoading(false)
                if (success) {
                    Log.d("CreatePostActivity", "Post added successfully with hashtags: ${post.hashtags}")
                    showToast("Post shared successfully!")
                    finish()
                } else {
                    Log.e("CreatePostActivity", "Failed to add post to Firestore")
                    showToast("Failed to share post. Please check your connection and try again.")
                }
            }
        }
    }

    private fun extractHashtags(description: String): List<String> {
        return HashtagUtil.extractHashtagsList(description)
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.shareButton.isEnabled = !show
        binding.shareButton.text = if (show) "Sharing..." else "Share"
    }

    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
