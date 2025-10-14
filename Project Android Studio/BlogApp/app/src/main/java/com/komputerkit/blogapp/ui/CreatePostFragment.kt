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
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.komputerkit.blogapp.R
import com.komputerkit.blogapp.databinding.FragmentCreatePostBinding
import com.komputerkit.blogapp.utils.ImageUtils
import com.komputerkit.blogapp.viewmodel.BlogViewModel

class CreatePostFragment : Fragment() {

    private var _binding: FragmentCreatePostBinding? = null
    private val binding get() = _binding!!
    private val blogViewModel: BlogViewModel by viewModels()
    
    private var selectedImageBase64: String? = null

    // Image picker launcher
    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                handleSelectedImage(uri)
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCreatePostBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupToolbar()
        setupClickListeners()
        observeViewModel()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            findNavController().navigateUp()
        }
    }

    private fun setupClickListeners() {
        binding.btnPublish.setOnClickListener {
            publishPost()
        }
        
        binding.btnSelectImage.setOnClickListener {
            selectImage()
        }
        
        binding.btnRemoveImage.setOnClickListener {
            removeSelectedImage()
        }
    }
    
    private fun selectImage() {
        try {
            Log.d("CreatePost", "Opening image picker directly to Photos & Videos")
            
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
                    Log.d("CreatePost", "Using Google Photos intent")
                    imagePickerLauncher.launch(intent)
                    return
                }
            } catch (e: Exception) {
                Log.w("CreatePost", "Google Photos not available: ${e.message}")
            }
            
            // Try fallback intents
            for ((index, fallbackIntent) in fallbackIntents.withIndex()) {
                try {
                    if (fallbackIntent.resolveActivity(requireContext().packageManager) != null) {
                        Log.d("CreatePost", "Using fallback intent $index")
                        imagePickerLauncher.launch(fallbackIntent)
                        return
                    }
                } catch (e: Exception) {
                    Log.w("CreatePost", "Fallback intent $index failed: ${e.message}")
                }
            }
            
            // If all else fails, show error
            Toast.makeText(requireContext(), "Tidak dapat membuka galeri", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Log.e("CreatePost", "Error opening image picker", e)
            Toast.makeText(requireContext(), "Error membuka pemilih gambar: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun handleSelectedImage(uri: Uri) {
        Log.d("CreatePost", "Image selected: $uri")
        
        try {
            // Show loading feedback
            Toast.makeText(requireContext(), "Memproses gambar...", Toast.LENGTH_SHORT).show()
            
            // Convert image to base64
            selectedImageBase64 = ImageUtils.uriToBase64(requireContext(), uri, maxSize = 1024)
            
            if (selectedImageBase64 != null && selectedImageBase64!!.isNotEmpty()) {
                // Display selected image
                val bitmap = ImageUtils.base64ToBitmap(selectedImageBase64!!)
                if (bitmap != null) {
                    binding.ivBlogImage.setImageBitmap(bitmap)
                    binding.ivBlogImage.visibility = View.VISIBLE
                    binding.btnRemoveImage.visibility = View.VISIBLE
                    
                    Log.d("CreatePost", "Image converted to base64 successfully, size: ${selectedImageBase64!!.length}")
                    Toast.makeText(requireContext(), "Gambar berhasil dipilih", Toast.LENGTH_SHORT).show()
                } else {
                    Log.e("CreatePost", "Failed to convert base64 back to bitmap")
                    Toast.makeText(requireContext(), "Format gambar tidak didukung", Toast.LENGTH_SHORT).show()
                    selectedImageBase64 = null
                }
            } else {
                Log.e("CreatePost", "Failed to convert image to base64")
                Toast.makeText(requireContext(), "Gagal memproses gambar. Pastikan file adalah gambar yang valid.", Toast.LENGTH_LONG).show()
            }
        } catch (e: Exception) {
            Log.e("CreatePost", "Error processing selected image", e)
            Toast.makeText(requireContext(), "Error memproses gambar: ${e.message}", Toast.LENGTH_LONG).show()
            selectedImageBase64 = null
        }
    }
    
    private fun removeSelectedImage() {
        selectedImageBase64 = null
        binding.ivBlogImage.setImageResource(R.drawable.ic_image_placeholder)
        binding.ivBlogImage.visibility = View.GONE
        binding.btnRemoveImage.visibility = View.GONE
        Toast.makeText(requireContext(), "Gambar dihapus", Toast.LENGTH_SHORT).show()
    }

    private fun publishPost() {
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

        // Log image information
        if (selectedImageBase64 != null) {
            Log.d("CreatePost", "Publishing with image, size: ${selectedImageBase64!!.length}")
        } else {
            Log.d("CreatePost", "Publishing without image")
        }

        blogViewModel.createPost(title, content, selectedImageBase64)
    }

    private fun observeViewModel() {
        blogViewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnPublish.isEnabled = !isLoading
        }

        blogViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                blogViewModel.clearError()
            }
        }

        blogViewModel.postCreated.observe(viewLifecycleOwner) { created ->
            if (created) {
                Toast.makeText(requireContext(), "Postingan berhasil dipublikasikan!", Toast.LENGTH_SHORT).show()
                findNavController().navigate(R.id.action_create_post_to_home)
                blogViewModel.clearPostCreated()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
