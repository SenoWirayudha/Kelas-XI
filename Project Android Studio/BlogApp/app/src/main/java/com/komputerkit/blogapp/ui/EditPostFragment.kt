package com.komputerkit.blogapp.ui

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.komputerkit.blogapp.data.BlogPost
import com.komputerkit.blogapp.databinding.FragmentEditPostBinding
import com.komputerkit.blogapp.utils.ImageUtils
import com.komputerkit.blogapp.viewmodel.BlogViewModel

class EditPostFragment : Fragment() {

    private var _binding: FragmentEditPostBinding? = null
    private val binding get() = _binding!!
    private val args: EditPostFragmentArgs by navArgs()
    private val blogViewModel: BlogViewModel by viewModels()
    private var currentPost: BlogPost? = null
    private var selectedImageBase64: String? = null
    
    private lateinit var imagePickerLauncher: ActivityResultLauncher<Intent>

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEditPostBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupImagePicker()
        setupToolbar()
        setupClickListeners()
        observeViewModel()
        loadPost()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            findNavController().navigateUp()
        }
    }

    private fun setupImagePicker() {
        imagePickerLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                result.data?.data?.let { uri ->
                    handleImageSelection(uri)
                }
            }
        }
    }

    private fun handleImageSelection(uri: Uri) {
        try {
            Log.d("EditPost", "Image selected: $uri")
            
            // Show loading feedback
            Toast.makeText(requireContext(), "Memproses gambar...", Toast.LENGTH_SHORT).show()
            
            selectedImageBase64 = ImageUtils.uriToBase64(requireContext(), uri)
            
            if (selectedImageBase64 != null && selectedImageBase64!!.isNotEmpty()) {
                // Display the selected image
                val bitmap = ImageUtils.base64ToBitmap(selectedImageBase64!!)
                if (bitmap != null) {
                    binding.ivBlogImage.setImageBitmap(bitmap)
                    binding.ivBlogImage.visibility = View.VISIBLE
                    binding.btnRemoveImage.visibility = View.VISIBLE
                    Log.d("EditPost", "Image converted to base64 successfully")
                    Toast.makeText(requireContext(), "Gambar berhasil dipilih", Toast.LENGTH_SHORT).show()
                } else {
                    Log.e("EditPost", "Failed to convert base64 back to bitmap")
                    Toast.makeText(requireContext(), "Format gambar tidak didukung", Toast.LENGTH_SHORT).show()
                    selectedImageBase64 = null
                }
            } else {
                Log.e("EditPost", "Failed to convert image to base64")
                Toast.makeText(requireContext(), "Gagal memproses gambar. Pastikan file adalah gambar yang valid.", Toast.LENGTH_LONG).show()
            }
        } catch (e: Exception) {
            Log.e("EditPost", "Error handling image selection", e)
            Toast.makeText(requireContext(), "Error memproses gambar: ${e.message}", Toast.LENGTH_LONG).show()
            selectedImageBase64 = null
        }
    }

    private fun openImagePicker() {
        try {
            Log.d("EditPost", "Opening image picker directly to Photos & Videos")
            
            // Create intent to go directly to Photos & Videos
            val intent = Intent(Intent.ACTION_PICK).apply {
                type = "image/*"
                // Add flags to go directly to gallery without showing chooser
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                // Try to specify Photos app specifically
                setPackage("com.google.android.apps.photos")
            }
            
            // Fallback intents if Google Photos is not available
            val fallbackIntents = listOf(
                // Samsung Gallery
                Intent(Intent.ACTION_PICK).apply {
                    type = "image/*"
                    setPackage("com.sec.android.gallery3d")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                },
                // Generic gallery intent
                Intent(Intent.ACTION_PICK).apply {
                    type = "image/*"
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                },
                // Enhanced ACTION_GET_CONTENT with all supported image types
                Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                        "image/jpeg", 
                        "image/png", 
                        "image/jpg", 
                        "image/webp", 
                        "image/bmp", 
                        "image/gif",
                        "image/tiff",
                        "image/heic",
                        "image/heif"
                    ))
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
            )
            
            // Try primary intent first
            try {
                if (intent.resolveActivity(requireContext().packageManager) != null) {
                    Log.d("EditPost", "Using Google Photos intent")
                    imagePickerLauncher.launch(intent)
                    return
                }
            } catch (e: Exception) {
                Log.w("EditPost", "Google Photos not available: ${e.message}")
            }
            
            // Try fallback intents
            for ((index, fallbackIntent) in fallbackIntents.withIndex()) {
                try {
                    if (fallbackIntent.resolveActivity(requireContext().packageManager) != null) {
                        Log.d("EditPost", "Using fallback intent $index")
                        imagePickerLauncher.launch(fallbackIntent)
                        return
                    }
                } catch (e: Exception) {
                    Log.w("EditPost", "Fallback intent $index failed: ${e.message}")
                }
            }
            
            // If all else fails, show error
            Toast.makeText(requireContext(), "Tidak dapat membuka galeri", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Log.e("EditPost", "Error opening image picker", e)
            Toast.makeText(requireContext(), "Error membuka pemilih gambar: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun removeImage() {
        selectedImageBase64 = null
        binding.ivBlogImage.visibility = View.GONE
        binding.btnRemoveImage.visibility = View.GONE
        Log.d("EditPost", "Image removed")
    }

    private fun setupClickListeners() {
        binding.btnUpdate.setOnClickListener {
            updatePost()
        }

        binding.btnSelectImage.setOnClickListener {
            openImagePicker()
        }

        binding.btnRemoveImage.setOnClickListener {
            removeImage()
        }
    }

    private fun loadPost() {
        blogViewModel.getPostById(args.postId)
    }

    private fun updatePost() {
        val title = binding.etTitle.text.toString().trim()
        val content = binding.etContent.text.toString().trim()

        // Clear previous errors
        binding.tilTitle.error = null
        binding.tilContent.error = null

        // Validation
        if (title.isEmpty()) {
            binding.tilTitle.error = "Judul tidak boleh kosong"
            return
        }
        if (content.isEmpty()) {
            binding.tilContent.error = "Konten tidak boleh kosong"
            return
        }

        currentPost?.let { post ->
            // Use selectedImageBase64 if image was changed, otherwise keep original imageUrl
            val imageToUpdate = selectedImageBase64 ?: post.imageUrl
            blogViewModel.updatePost(post.id, title, content, imageToUpdate)
        }
    }

    private fun observeViewModel() {
        blogViewModel.currentPost.observe(viewLifecycleOwner) { post ->
            post?.let {
                currentPost = it
                populateFields(it)
            }
        }

        blogViewModel.postUpdated.observe(viewLifecycleOwner) { updated ->
            if (updated) {
                Toast.makeText(requireContext(), "Postingan berhasil diperbarui!", Toast.LENGTH_SHORT).show()
                
                // Check if we should return to profile or go to blog detail
                if (args.returnToProfile) {
                    // Navigate back to profile page
                    val action = EditPostFragmentDirections.actionEditPostToProfile()
                    findNavController().navigate(action)
                } else {
                    // Navigate to blog detail with updated post
                    val action = EditPostFragmentDirections
                        .actionEditPostToBlogDetail(args.postId, args.userId, true)
                    findNavController().navigate(action)
                }
                
                blogViewModel.clearPostUpdated()
            }
        }

        blogViewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnUpdate.isEnabled = !isLoading
        }

        blogViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                blogViewModel.clearError()
            }
        }
    }

    private fun populateFields(post: BlogPost) {
        binding.etTitle.setText(post.title)
        binding.etContent.setText(post.content)
        
        // Initialize selectedImageBase64 with current post image
        selectedImageBase64 = post.imageUrl
        
        // Display existing image if available
        if (!post.imageUrl.isNullOrEmpty()) {
            try {
                val bitmap = ImageUtils.base64ToBitmap(post.imageUrl)
                if (bitmap != null) {
                    binding.ivBlogImage.setImageBitmap(bitmap)
                    binding.ivBlogImage.visibility = View.VISIBLE
                    binding.btnRemoveImage.visibility = View.VISIBLE
                    Log.d("EditPost", "Existing blog image loaded successfully")
                } else {
                    binding.ivBlogImage.visibility = View.GONE
                    binding.btnRemoveImage.visibility = View.GONE
                }
            } catch (e: Exception) {
                Log.e("EditPost", "Error loading existing blog image", e)
                binding.ivBlogImage.visibility = View.GONE
                binding.btnRemoveImage.visibility = View.GONE
            }
        } else {
            binding.ivBlogImage.visibility = View.GONE
            binding.btnRemoveImage.visibility = View.GONE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
