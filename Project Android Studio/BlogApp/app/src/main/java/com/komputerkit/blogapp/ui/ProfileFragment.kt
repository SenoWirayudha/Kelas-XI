
package com.komputerkit.blogapp.ui

import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.blogapp.R
import com.komputerkit.blogapp.adapter.BlogPostAdapter
import com.komputerkit.blogapp.data.BlogPost
import com.komputerkit.blogapp.databinding.FragmentProfileBinding
import com.komputerkit.blogapp.utils.ImageUtils
import com.komputerkit.blogapp.viewmodel.AuthViewModel
import com.komputerkit.blogapp.viewmodel.BlogViewModel
import java.io.File

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    private val authViewModel: AuthViewModel by viewModels()
    private val blogViewModel: BlogViewModel by viewModels()
    private lateinit var adapter: BlogPostAdapter
    
    // Enhanced gallery launcher with direct media access
    private val galleryLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        Log.d("ProfileFragment", "Gallery result code: ${result.resultCode}")
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                Log.d("ProfileFragment", "Gallery result URI: $uri")
                processSelectedImage(uri)
            } ?: run {
                Log.e("ProfileFragment", "No URI in result data")
                Toast.makeText(requireContext(), "Tidak ada gambar yang dipilih", Toast.LENGTH_SHORT).show()
            }
        } else {
            Log.d("ProfileFragment", "Gallery selection cancelled or failed")
            Toast.makeText(requireContext(), "Pemilihan gambar dibatalkan", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        Log.d("ProfileFragment", "=== PROFILE FRAGMENT VIEW CREATED ===")
        setupRecyclerView()
        setupClickListeners()
        observeViewModel()
        
        // Initial load with delay to ensure Firebase Auth is ready - with null check
        view.postDelayed({
            if (_binding != null && isAdded && !isDetached) {
                loadUserProfile()
                loadUserPosts()
            } else {
                Log.d("ProfileFragment", "Fragment not available in onViewCreated, skipping initial load")
            }
        }, 500)
    }

    override fun onResume() {
        super.onResume()
        Log.d("ProfileFragment", "=== PROFILE FRAGMENT RESUMED ===")
        // Reload user profile and posts when fragment becomes visible again - with null check
        view?.postDelayed({
            if (_binding != null && isAdded && !isDetached) {
                refreshProfile()
            } else {
                Log.d("ProfileFragment", "Fragment not available in onResume, skipping reload")
            }
        }, 1000) // Add delay to ensure everything is ready
    }

    private fun refreshProfile() {
        Log.d("ProfileFragment", "=== REFRESHING PROFILE ===")
        loadUserProfile()
        loadUserPostsWithFallback()
    }

    private fun loadUserPostsWithFallback() {
        val currentUser = FirebaseAuth.getInstance().currentUser
        if (currentUser != null) {
            Log.d("ProfileFragment", "Loading posts for current user: ${currentUser.uid}")
            Log.d("ProfileFragment", "Current user email: ${currentUser.email}")
            
            // First try normal user posts query
            blogViewModel.loadUserPosts(currentUser.uid)
            
            // Also try to fix orphaned posts in the background
            val displayName = binding.tvDisplayName.text.toString()
            if (displayName.isNotEmpty() && displayName != "Loading...") {
                Log.d("ProfileFragment", "Attempting to fix orphaned posts for user: $displayName")
                blogViewModel.fixOrphanedPosts(currentUser.uid, displayName)
            }
            
        } else {
            // Fallback to authViewModel if Firebase Auth user is not available
            authViewModel.authState.value?.let { user ->
                Log.d("ProfileFragment", "Loading posts for auth user: ${user.uid}")
                Log.d("ProfileFragment", "Auth user email: ${user.email}")
                blogViewModel.loadUserPosts(user.uid)
                
                // Try to fix orphaned posts
                blogViewModel.fixOrphanedPosts(user.uid, user.displayName ?: "")
            } ?: run {
                Log.w("ProfileFragment", "No authenticated user found")
                // Try to refresh using the ViewModel method
                blogViewModel.refreshCurrentUserPosts()
            }
        }
    }

    private fun loadUserProfile() {
        val currentUser = FirebaseAuth.getInstance().currentUser
        currentUser?.let { user ->
            Log.d("ProfileFragment", "Loading user profile for: ${user.uid}")
            Log.d("ProfileFragment", "User email: ${user.email}")
            
            // Force reload from Firestore
            authViewModel.loadUserData(user.uid)
            
            // Add a fallback to force UI update after delay - with null check
            view?.postDelayed({
                if (_binding != null && isAdded && !isDetached) {
                    Log.d("ProfileFragment", "Fallback: Force checking userData after delay")
                    authViewModel.userData.value?.let { userData ->
                        Log.d("ProfileFragment", "Fallback: UserData found, updating UI")
                        updateUserUI(userData)
                    }
                } else {
                    Log.d("ProfileFragment", "Fallback: Fragment not available, skipping UI update")
                }
            }, 3000)
            
            // Also show basic info from Firebase Auth as fallback - with null check
            if (_binding != null && isAdded) {
                if (binding.tvDisplayName.text.isEmpty() || binding.tvDisplayName.text == "User not found") {
                    Log.d("ProfileFragment", "Setting fallback data from Firebase Auth")
                    binding.tvDisplayName.text = user.displayName ?: user.email?.substringBefore("@") ?: "User"
                    binding.tvEmail.text = user.email ?: ""
                }
            }
        } ?: run {
            Log.e("ProfileFragment", "Current user is null, cannot load profile")
            if (_binding != null && isAdded) {
                binding.tvDisplayName.text = "User not found"
                binding.tvEmail.text = ""
            }
        }
    }
    
    private fun updateUserUI(user: com.komputerkit.blogapp.data.User) {
        // Check if fragment is still valid
        if (_binding == null || !isAdded || isDetached) {
            Log.d("ProfileFragment", "Fragment not available, skipping updateUserUI")
            return
        }
        
        Log.d("ProfileFragment", "=== UPDATING USER UI ===")
        Log.d("ProfileFragment", "User: ${user.displayName} (${user.email})")
        binding.tvDisplayName.text = user.displayName
        binding.tvEmail.text = user.email
        
        // Load profile image from base64
        if (user.profileImageBase64.isNotEmpty()) {
            Log.d("ProfileFragment", "Profile image base64 found!")
            Log.d("ProfileFragment", "Base64 length: ${user.profileImageBase64.length}")
            Log.d("ProfileFragment", "Base64 preview: ${user.profileImageBase64.take(100)}...")
            
            try {
                val bitmap = ImageUtils.base64ToBitmap(user.profileImageBase64)
                if (bitmap != null) {
                    Log.d("ProfileFragment", "✅ Bitmap created successfully: ${bitmap.width}x${bitmap.height}")
                    Log.d("ProfileFragment", "Bitmap config: ${bitmap.config}")
                    Log.d("ProfileFragment", "Bitmap bytes: ${bitmap.allocationByteCount}")
                    
                    // Set bitmap to ImageView
                    binding.ivProfilePicture.setImageBitmap(bitmap)
                    binding.ivProfilePicture.clearColorFilter() // Clear any tint
                    binding.ivProfilePicture.imageTintList = null // Clear tint list
                    Log.d("ProfileFragment", "✅ Bitmap set to ImageView")
                    
                    // Debug ImageView properties
                    Log.d("ProfileFragment", "ImageView visibility: ${binding.ivProfilePicture.visibility}")
                    Log.d("ProfileFragment", "ImageView alpha: ${binding.ivProfilePicture.alpha}")
                    Log.d("ProfileFragment", "ImageView width: ${binding.ivProfilePicture.width}")
                    Log.d("ProfileFragment", "ImageView height: ${binding.ivProfilePicture.height}")
                    Log.d("ProfileFragment", "ImageView scaleType: ${binding.ivProfilePicture.scaleType}")
                    Log.d("ProfileFragment", "ImageView drawable: ${binding.ivProfilePicture.drawable}")
                    
                    // Ensure visibility and properties
                    binding.ivProfilePicture.visibility = android.view.View.VISIBLE
                    binding.ivProfilePicture.alpha = 1.0f
                    binding.ivProfilePicture.scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
                    
                    // Force view refresh
                    binding.ivProfilePicture.invalidate()
                    binding.ivProfilePicture.requestLayout()
                    binding.flProfilePictureContainer.invalidate()
                    binding.flProfilePictureContainer.requestLayout()
                    Log.d("ProfileFragment", "✅ ImageView refreshed")
                } else {
                    Log.e("ProfileFragment", "❌ Failed to create bitmap from base64")
                    // Try alternative approach
                    tryAlternativeImageLoading(user.profileImageBase64)
                }
            } catch (e: Exception) {
                Log.e("ProfileFragment", "❌ Exception creating bitmap", e)
                tryAlternativeImageLoading(user.profileImageBase64)
            }
        } else {
            Log.d("ProfileFragment", "No profile image found (empty base64)")
            // Set default image - with null check
            if (_binding != null && isAdded && !isDetached) {
                binding.ivProfilePicture.setImageResource(android.R.drawable.ic_menu_camera)
            }
        }
        Log.d("ProfileFragment", "=== USER UI UPDATE COMPLETE ===")
    }
    
    private fun tryAlternativeImageLoading(base64String: String) {
        // Check if fragment is still valid
        if (_binding == null || !isAdded || isDetached) {
            Log.d("ProfileFragment", "Fragment not available, skipping alternative image loading")
            return
        }
        
        Log.d("ProfileFragment", "Trying alternative image loading...")
        try {
            // Remove any potential data URL prefix
            val cleanBase64 = if (base64String.contains(",")) {
                base64String.substringAfter(",")
            } else {
                base64String
            }
            
            val decodedBytes = android.util.Base64.decode(cleanBase64, android.util.Base64.DEFAULT)
            val bitmap = android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            
            if (bitmap != null) {
                Log.d("ProfileFragment", "✅ Alternative loading successful: ${bitmap.width}x${bitmap.height}")
                binding.ivProfilePicture.setImageBitmap(bitmap)
            } else {
                Log.e("ProfileFragment", "❌ Alternative loading also failed")
            }
        } catch (e: Exception) {
            Log.e("ProfileFragment", "❌ Alternative loading exception", e)
        }
    }

    private fun setupRecyclerView() {
        val currentUserId = FirebaseAuth.getInstance().currentUser?.uid
        
        adapter = BlogPostAdapter(
            onItemClick = { post -> onPostClick(post) },
            onLikeClick = { post -> onLikeClick(post) },
            onSaveClick = { post -> onSaveClick(post) },
            onEditClick = { post -> onEditClick(post) },
            onDeleteClick = { post -> onDeleteClick(post) },
            currentUserId = currentUserId
        )
        
        binding.rvUserPosts.apply {
            layoutManager = LinearLayoutManager(requireContext()).apply {
                // Ensure proper measurement
                isAutoMeasureEnabled = true
            }
            adapter = this@ProfileFragment.adapter
            isNestedScrollingEnabled = false
            setHasFixedSize(false) // Allow RecyclerView to change size
            itemAnimator = null // Disable animations to prevent layout issues
            
            // Force proper height calculation
            viewTreeObserver.addOnGlobalLayoutListener {
                requestLayout()
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnLogout.setOnClickListener {
            authViewModel.signOut()
        }
        
        binding.btnSavedPosts.setOnClickListener {
            findNavController().navigate(R.id.action_profile_to_saved_posts)
        }

        binding.fabEditPhoto.setOnClickListener {
            openGallery()
        }

        binding.btnEditName.setOnClickListener {
            showEditNameDialog()
        }

        // Add double-tap to refresh functionality
        var lastTapTime = 0L
        binding.tvDisplayName.setOnClickListener {
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastTapTime < 500) { // Double tap within 500ms
                Log.d("ProfileFragment", "Double tap detected - refreshing posts and fixing orphaned posts")
                Toast.makeText(requireContext(), "Memuat ulang dan memperbaiki postingan...", Toast.LENGTH_LONG).show()
                
                // Force fix orphaned posts
                val currentUser = FirebaseAuth.getInstance().currentUser
                val displayName = binding.tvDisplayName.text.toString()
                if (currentUser != null && displayName.isNotEmpty() && displayName != "Loading...") {
                    blogViewModel.fixOrphanedPosts(currentUser.uid, displayName)
                }
                
                refreshProfile()
            }
            lastTapTime = currentTime
        }
    }

    private fun observeViewModel() {
        authViewModel.userData.observe(viewLifecycleOwner) { user ->
            Log.d("ProfileFragment", "UserData observed: $user")
            user?.let {
                Log.d("ProfileFragment", "User data received, updating UI")
                updateUserUI(it)
            } ?: run {
                Log.e("ProfileFragment", "User data is null, checking Firebase Auth...")
                val currentUser = FirebaseAuth.getInstance().currentUser
                currentUser?.let { firebaseUser ->
                    Log.d("ProfileFragment", "Firebase user exists: ${firebaseUser.uid}, email: ${firebaseUser.email}")
                    
                    // Show Firebase Auth data immediately as fallback - with null check
                    if (_binding != null && isAdded && !isDetached) {
                        binding.tvDisplayName.text = firebaseUser.displayName ?: firebaseUser.email?.substringBefore("@") ?: "User"
                        binding.tvEmail.text = firebaseUser.email ?: ""
                    }
                    
                    // Try to create missing user document or retry loading
                    val displayName = firebaseUser.displayName ?: firebaseUser.email?.substringBefore("@") ?: "User"
                    val email = firebaseUser.email ?: ""
                    
                    Log.d("ProfileFragment", "Creating missing user document or retrying...")
                    authViewModel.createMissingUserDocument(email, displayName)
                    
                    // Also retry loading after a delay - with null check
                    view?.postDelayed({
                        if (_binding != null && isAdded && !isDetached) {
                            Log.d("ProfileFragment", "Retrying user data load...")
                            authViewModel.loadUserData(firebaseUser.uid)
                        }
                    }, 2000)
                    
                } ?: run {
                    Log.e("ProfileFragment", "No Firebase user found")
                    if (_binding != null && isAdded && !isDetached) {
                        binding.tvDisplayName.text = "User not found"
                        binding.tvEmail.text = ""
                    }
                }
            }
        }

        authViewModel.authState.observe(viewLifecycleOwner) { user ->
            if (user == null) {
                findNavController().navigate(R.id.action_profile_to_welcome)
            } else {
                // Reload user posts when auth state changes
                Log.d("ProfileFragment", "Auth state changed, reloading posts for user: ${user.uid}")
                blogViewModel.loadUserPosts(user.uid)
            }
        }

        blogViewModel.userPosts.observe(viewLifecycleOwner) { posts ->
            Log.d("ProfileFragment", "=== RECEIVED USER POSTS ===")
            Log.d("ProfileFragment", "Total posts count: ${posts.size}")
            posts.forEachIndexed { index, post ->
                Log.d("ProfileFragment", "Post $index: id=${post.id}, title='${post.title}', authorId=${post.authorId}, createdAt=${post.createdAt}")
            }
            
            // Submit list to adapter
            adapter.submitList(posts) {
                // Force layout update after list is submitted
                if (_binding != null && isAdded && !isDetached) {
                    binding.rvUserPosts.requestLayout()
                    binding.rvUserPosts.invalidate()
                }
            }
            
            // Update UI with null check
            if (_binding != null && isAdded && !isDetached) {
                if (posts.isEmpty()) {
                    Log.d("ProfileFragment", "No posts found, showing empty state")
                    binding.tvEmptyPosts.visibility = View.VISIBLE
                    binding.rvUserPosts.visibility = View.GONE
                } else {
                    Log.d("ProfileFragment", "Posts found, showing list")
                    binding.tvEmptyPosts.visibility = View.GONE
                    binding.rvUserPosts.visibility = View.VISIBLE
                    
                    // Force RecyclerView to recalculate its height
                    binding.rvUserPosts.post {
                        binding.rvUserPosts.requestLayout()
                    }
                }
            }
        }

        blogViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                blogViewModel.clearError()
            }
        }

        authViewModel.profileUpdateSuccess.observe(viewLifecycleOwner) { success ->
            if (success) {
                Log.d("ProfileFragment", "Profile update successful, refreshing user data and posts")
                Toast.makeText(requireContext(), "Profil berhasil diperbarui", Toast.LENGTH_SHORT).show()
                
                // Add a delay before reloading to ensure Firestore has processed the update
                view?.postDelayed({
                    Log.d("ProfileFragment", "Reloading user profile and posts after update")
                    loadUserProfile()
                    // Also refresh posts to show updated author info
                    loadUserPostsWithFallback()
                }, 3000) // Wait 3 seconds to ensure blog posts are also updated
                
                authViewModel.clearProfileUpdateSuccess()
            }
        }

        authViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Log.e("ProfileFragment", "AuthViewModel error: $it")
                Toast.makeText(requireContext(), "Error: $it", Toast.LENGTH_LONG).show()
                authViewModel.clearError()
            }
        }

        authViewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            // You can add a progress indicator here if needed
            Log.d("ProfileFragment", "Loading state: $isLoading")
        }

        // Add observer for auth state changes
        authViewModel.authState.observe(viewLifecycleOwner) { user ->
            if (user != null) {
                Log.d("ProfileFragment", "Auth state changed - user logged in: ${user.uid}")
                // Refresh user profile when auth state changes
                view?.postDelayed({
                    loadUserProfile()
                }, 1000)
            } else {
                Log.d("ProfileFragment", "Auth state changed - user logged out")
            }
        }

        // Observe post creation/update events to refresh user posts
        blogViewModel.postCreated.observe(viewLifecycleOwner) { created ->
            if (created) {
                Log.d("ProfileFragment", "Post created, refreshing user posts")
                loadUserPosts()
                blogViewModel.clearPostCreated()
            }
        }

        blogViewModel.postUpdated.observe(viewLifecycleOwner) { updated ->
            if (updated) {
                Log.d("ProfileFragment", "Post updated, refreshing user posts")
                loadUserPosts()
                blogViewModel.clearPostUpdated()
            }
        }

        blogViewModel.postDeleted.observe(viewLifecycleOwner) { deleted ->
            if (deleted) {
                Log.d("ProfileFragment", "Post deleted, refreshing user posts")
                loadUserPosts()
                blogViewModel.clearPostDeleted()
            }
        }
    }

    private fun loadUserPosts() {
        loadUserPostsWithFallback()
    }

    private fun onPostClick(post: BlogPost) {
        val action = ProfileFragmentDirections
            .actionProfileToBlogDetail(post.id, post.authorId, true)
        findNavController().navigate(action)
    }

    private fun onLikeClick(post: BlogPost) {
        blogViewModel.toggleLike(post.id)
    }

    private fun onSaveClick(post: BlogPost) {
        blogViewModel.toggleSave(post.id)
    }

    private fun onEditClick(post: BlogPost) {
        val action = ProfileFragmentDirections
            .actionProfileToEditPost(post.id, post.authorId, true)
        findNavController().navigate(action)
    }

    private fun onDeleteClick(post: BlogPost) {
        AlertDialog.Builder(requireContext())
            .setTitle("Hapus Postingan")
            .setMessage("Apakah Anda yakin ingin menghapus postingan \"${post.title}\"? Tindakan ini tidak dapat dibatalkan.")
            .setPositiveButton("Hapus") { _, _ ->
                blogViewModel.deletePost(post.id)
                Toast.makeText(requireContext(), "Postingan berhasil dihapus", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun openGallery() {
        Log.d("ProfileFragment", "Opening gallery directly to Photos & Videos")
        try {
            // Create intent to go directly to Photos & Videos
            val intent = Intent(Intent.ACTION_PICK).apply {
                type = "image/*"
                // Add flags to go directly to gallery without showing chooser
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                // Try to specify Photos app specifically
                setPackage("com.google.android.apps.photos")
            }
            
            // Fallback intents if Google Photos is not available
            val fallbackIntents = listOf(
                // Samsung Gallery
                Intent(Intent.ACTION_PICK).apply {
                    type = "image/*"
                    setPackage("com.sec.android.gallery3d")
                },
                // Generic gallery intent
                Intent(Intent.ACTION_PICK).apply {
                    type = "image/*"
                },
                // Alternative ACTION_GET_CONTENT
                Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }
            )
            
            // Try primary intent first
            try {
                if (intent.resolveActivity(requireContext().packageManager) != null) {
                    Log.d("ProfileFragment", "Using Google Photos intent")
                    galleryLauncher.launch(intent)
                    return
                }
            } catch (e: Exception) {
                Log.w("ProfileFragment", "Google Photos not available: ${e.message}")
            }
            
            // Try fallback intents
            for ((index, fallbackIntent) in fallbackIntents.withIndex()) {
                try {
                    if (fallbackIntent.resolveActivity(requireContext().packageManager) != null) {
                        Log.d("ProfileFragment", "Using fallback intent $index")
                        galleryLauncher.launch(fallbackIntent)
                        return
                    }
                } catch (e: Exception) {
                    Log.w("ProfileFragment", "Fallback intent $index failed: ${e.message}")
                }
            }
            
            // If all else fails, show error
            Toast.makeText(requireContext(), "Tidak dapat membuka galeri", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Log.e("ProfileFragment", "Error opening gallery", e)
            Toast.makeText(requireContext(), "Error membuka galeri: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun processSelectedImage(uri: Uri) {
        try {
            Log.d("ProfileFragment", "Processing image URI: $uri")
            val base64Image = ImageUtils.uriToBase64(requireContext(), uri, 800)
            if (base64Image != null) {
                Log.d("ProfileFragment", "Image converted to base64, length: ${base64Image.length}")
                authViewModel.updateProfilePhoto(base64Image)
            } else {
                Log.e("ProfileFragment", "Failed to convert image to base64")
                Toast.makeText(requireContext(), "Gagal memproses gambar", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e("ProfileFragment", "Error processing image", e)
            Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showEditNameDialog() {
        if (_binding == null || !isAdded || isDetached) {
            return
        }
        
        // Inflate dialog layout
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_edit_name, null)
        val etDisplayName = dialogView.findViewById<TextInputEditText>(R.id.et_display_name)
        
        // Set current display name
        etDisplayName.setText(binding.tvDisplayName.text.toString())
        
        // Create dialog
        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .setCancelable(true)
            .create()
        
        // Setup button listeners
        dialogView.findViewById<View>(R.id.btn_cancel).setOnClickListener {
            dialog.dismiss()
        }
        
        dialogView.findViewById<View>(R.id.btn_save).setOnClickListener {
            val newName = etDisplayName.text.toString().trim()
            
            if (newName.isEmpty()) {
                Toast.makeText(requireContext(), "Nama tidak boleh kosong", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            if (newName.length < 2) {
                Toast.makeText(requireContext(), "Nama minimal 2 karakter", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            if (newName.length > 50) {
                Toast.makeText(requireContext(), "Nama maksimal 50 karakter", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            // Update display name
            authViewModel.updateDisplayName(newName)
            dialog.dismiss()
        }
        
        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
