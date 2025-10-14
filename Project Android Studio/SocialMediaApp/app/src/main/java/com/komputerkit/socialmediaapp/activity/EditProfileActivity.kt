package com.komputerkit.socialmediaapp.activity

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CircleCrop
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.socialmediaapp.base.BaseActivity
import com.komputerkit.socialmediaapp.databinding.ActivityEditProfileBinding
import com.komputerkit.socialmediaapp.model.User
import java.io.ByteArrayOutputStream
import java.io.InputStream

/**
 * EditProfileActivity - Sederhana untuk edit profile user
 * - Load data user dari Firestore berdasarkan currentUser
 * - Form input: fullName, username, profile image
 * - Update langsung ke Firestore collection "users"
 * - Auto refresh via Firestore snapshot listeners
 */
class EditProfileActivity : BaseActivity() {
    
    private lateinit var binding: ActivityEditProfileBinding
    private val firestore = FirebaseFirestore.getInstance()
    private val firebaseAuth = FirebaseAuth.getInstance()
    
    private var selectedImageBase64: String? = null
    private var hasImageChanged = false
    
    // Activity result launcher untuk pilih foto
    private val selectImageLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { imageUri ->
                handleSelectedImage(imageUri)
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEditProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()
        setupClickListeners()
        loadCurrentUserData()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }
    
    private fun setupClickListeners() {
        // Change photo button
        binding.changePhotoButton.setOnClickListener {
            selectImageFromGallery()
        }
        
        // Save button
        binding.saveButton.setOnClickListener {
            saveProfile()
        }
    }
    
    private fun loadCurrentUserData() {
        val currentUserId = firebaseAuth.currentUser?.uid
        if (currentUserId == null) {
            Toast.makeText(this, "User tidak ditemukan", Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        
        binding.progressBar.visibility = View.VISIBLE
        
        firestore.collection("users")
            .document(currentUserId)
            .get()
            .addOnSuccessListener { document ->
                binding.progressBar.visibility = View.GONE
                
                if (document.exists()) {
                    val user = document.toObject(User::class.java)
                    user?.let { populateUserData(it) }
                } else {
                    Toast.makeText(this, "Data user tidak ditemukan", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener { exception ->
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this, "Gagal memuat data: ${exception.message}", Toast.LENGTH_LONG).show()
            }
    }
    
    private fun populateUserData(user: User) {
        binding.fullNameEditText.setText(user.fullName)
        binding.usernameEditText.setText(user.username)
        
        // Load profile image
        if (!user.profileImageUrl.isNullOrEmpty()) {
            if (user.profileImageUrl.startsWith("data:image") || user.profileImageUrl.startsWith("/9j")) {
                // Base64 image
                val imageBytes = if (user.profileImageUrl.startsWith("data:image")) {
                    // Remove data:image/jpeg;base64, prefix if present
                    val base64String = user.profileImageUrl.substring(user.profileImageUrl.indexOf(",") + 1)
                    Base64.decode(base64String, Base64.DEFAULT)
                } else {
                    Base64.decode(user.profileImageUrl, Base64.DEFAULT)
                }
                
                val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
                Glide.with(this)
                    .load(bitmap)
                    .transform(CircleCrop())
                    .into(binding.profileImageView)
            } else {
                // URL image
                Glide.with(this)
                    .load(user.profileImageUrl)
                    .transform(CircleCrop())
                    .into(binding.profileImageView)
            }
        }
    }
    
    private fun selectImageFromGallery() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        intent.type = "image/*"
        selectImageLauncher.launch(intent)
    }
    
    private fun handleSelectedImage(imageUri: Uri) {
        try {
            // Load and display image
            Glide.with(this)
                .load(imageUri)
                .transform(CircleCrop())
                .into(binding.profileImageView)
            
            // Convert to base64
            val inputStream: InputStream? = contentResolver.openInputStream(imageUri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            
            // Resize bitmap if too large
            val resizedBitmap = resizeBitmap(bitmap, 500, 500)
            
            // Convert to base64
            selectedImageBase64 = bitmapToBase64(resizedBitmap)
            hasImageChanged = true
            
            Toast.makeText(this, "Foto profil dipilih", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Toast.makeText(this, "Gagal memproses gambar: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun resizeBitmap(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        val ratioBitmap = width.toFloat() / height.toFloat()
        val ratioMax = maxWidth.toFloat() / maxHeight.toFloat()
        
        var finalWidth = maxWidth
        var finalHeight = maxHeight
        
        if (ratioMax > ratioBitmap) {
            finalWidth = (maxHeight.toFloat() * ratioBitmap).toInt()
        } else {
            finalHeight = (maxWidth.toFloat() / ratioBitmap).toInt()
        }
        
        return Bitmap.createScaledBitmap(bitmap, finalWidth, finalHeight, true)
    }
    
    private fun bitmapToBase64(bitmap: Bitmap): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        val base64String = Base64.encodeToString(byteArray, Base64.DEFAULT)
        // Tambahkan prefix data URI untuk base64 image
        return "data:image/jpeg;base64,$base64String"
    }
    
    private fun saveProfile() {
        val fullName = binding.fullNameEditText.text.toString().trim()
        val username = binding.usernameEditText.text.toString().trim()
        
        // Validasi sederhana: username tidak boleh kosong
        if (username.isEmpty()) {
            binding.usernameEditText.error = "Username tidak boleh kosong"
            return
        }
        
        // Clear errors
        binding.fullNameEditText.error = null
        binding.usernameEditText.error = null
        
        val currentUserId = firebaseAuth.currentUser?.uid
        if (currentUserId == null) {
            Toast.makeText(this, "User tidak ditemukan", Toast.LENGTH_SHORT).show()
            return
        }
        
        binding.progressBar.visibility = View.VISIBLE
        binding.saveButton.isEnabled = false
        
        // Prepare update data
        val updates = mutableMapOf<String, Any>(
            "fullName" to fullName,
            "username" to username,
            "updatedAt" to System.currentTimeMillis()
        )
        
        // Add profile image if changed
        if (hasImageChanged && selectedImageBase64 != null) {
            updates["profileImageUrl"] = selectedImageBase64!!
        }
        
        // Update to Firestore
        firestore.collection("users")
            .document(currentUserId)
            .update(updates)
            .addOnSuccessListener {
                binding.progressBar.visibility = View.GONE
                binding.saveButton.isEnabled = true
                
                Toast.makeText(this, "Profil berhasil diperbarui", Toast.LENGTH_SHORT).show()
                
                // Set result and finish
                setResult(RESULT_OK)
                finish()
            }
            .addOnFailureListener { exception ->
                binding.progressBar.visibility = View.GONE
                binding.saveButton.isEnabled = true
                
                Toast.makeText(this, "Gagal memperbarui profil: ${exception.message}", Toast.LENGTH_LONG).show()
            }
    }
}
