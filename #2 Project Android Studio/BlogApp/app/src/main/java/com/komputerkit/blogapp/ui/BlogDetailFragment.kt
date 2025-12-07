package com.komputerkit.blogapp.ui

import android.app.AlertDialog
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.blogapp.R
import com.komputerkit.blogapp.data.BlogPost
import com.komputerkit.blogapp.databinding.FragmentBlogDetailBinding
import com.komputerkit.blogapp.utils.ImageUtils
import com.komputerkit.blogapp.viewmodel.AuthViewModel
import com.komputerkit.blogapp.viewmodel.BlogViewModel
import java.text.SimpleDateFormat
import java.util.*

class BlogDetailFragment : Fragment() {

    private var _binding: FragmentBlogDetailBinding? = null
    private val binding get() = _binding!!
    private val blogViewModel: BlogViewModel by viewModels()
    private val authViewModel: AuthViewModel by viewModels()
    private var currentPost: BlogPost? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBlogDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        Log.d("BlogDetail", "Fragment created, arguments: ${arguments}")
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

    private fun setupClickListeners() {
        binding.btnLike.setOnClickListener {
            currentPost?.let { post ->
                blogViewModel.toggleLike(post.id)
            }
        }

        binding.btnSave.setOnClickListener {
            currentPost?.let { post ->
                blogViewModel.toggleSave(post.id)
            }
        }
    }

    private fun loadPost() {
        // Get arguments safely without Safe Args
        val postId = arguments?.getString("postId")
        Log.d("BlogDetail", "Loading post with ID: $postId")
        
        if (postId != null && postId.isNotEmpty()) {
            blogViewModel.getPostById(postId)
        } else {
            Log.e("BlogDetail", "Post ID is null or empty")
            Toast.makeText(requireContext(), "Error: Post ID not found", Toast.LENGTH_SHORT).show()
            findNavController().navigateUp()
        }
    }

    private fun observeViewModel() {
        blogViewModel.currentPost.observe(viewLifecycleOwner) { post ->
            post?.let {
                currentPost = it
                displayPost(it)
            }
        }

        blogViewModel.postDeleted.observe(viewLifecycleOwner) { deleted ->
            if (deleted) {
                Toast.makeText(requireContext(), "Postingan berhasil dihapus", Toast.LENGTH_SHORT).show()
                findNavController().navigateUp()
                blogViewModel.clearPostDeleted()
            }
        }

        blogViewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            // You can add a loading indicator here if needed
        }

        blogViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                blogViewModel.clearError()
            }
        }
    }

    private fun displayPost(post: BlogPost) {
        binding.apply {
            tvTitle.text = post.title
            tvAuthor.text = post.authorName
            tvContent.text = post.content
            
            val dateFormat = SimpleDateFormat("dd MMMM yyyy, HH:mm", Locale.getDefault())
            tvDate.text = dateFormat.format(post.createdAt)
            
            // Debug logging
            Log.d("BlogDetail", "Author profile image: ${if (post.authorProfileImage.isNullOrEmpty()) "EMPTY" else "HAS DATA (${post.authorProfileImage?.length} chars)"}")
            Log.d("BlogDetail", "Author ID: ${post.authorId}")
            Log.d("BlogDetail", "Author Name: ${post.authorName}")
            
            // Display author profile image
            try {
                if (!post.authorProfileImage.isNullOrEmpty()) {
                    Log.d("BlogDetail", "Loading author profile image...")
                    Log.d("BlogDetail", "Base64 preview: ${post.authorProfileImage.take(50)}...")
                    
                    val bitmap = ImageUtils.base64ToBitmap(post.authorProfileImage)
                    if (bitmap != null) {
                        ivAuthorProfile.setImageBitmap(bitmap)
                        ivAuthorProfile.clearColorFilter()
                        ivAuthorProfile.imageTintList = null
                        Log.d("BlogDetail", "Author profile image loaded successfully: ${bitmap.width}x${bitmap.height}")
                    } else {
                        Log.e("BlogDetail", "Failed to convert base64 to bitmap")
                        ivAuthorProfile.setImageResource(R.drawable.ic_person)
                    }
                } else {
                    Log.d("BlogDetail", "No author profile image, using default")
                    ivAuthorProfile.setImageResource(R.drawable.ic_person)
                }
            } catch (e: Exception) {
                Log.e("BlogDetail", "Error loading author profile image", e)
                ivAuthorProfile.setImageResource(R.drawable.ic_person)
            }
            
            // Display blog post image
            try {
                if (!post.imageUrl.isNullOrEmpty()) {
                    Log.d("BlogDetail", "Loading blog post image...")
                    val bitmap = ImageUtils.base64ToBitmap(post.imageUrl)
                    if (bitmap != null) {
                        ivBlogImage.setImageBitmap(bitmap)
                        ivBlogImage.visibility = View.VISIBLE
                        Log.d("BlogDetail", "Blog post image loaded successfully: ${bitmap.width}x${bitmap.height}")
                    } else {
                        Log.e("BlogDetail", "Failed to convert blog image base64 to bitmap")
                        ivBlogImage.visibility = View.GONE
                    }
                } else {
                    Log.d("BlogDetail", "No blog post image, hiding image view")
                    ivBlogImage.visibility = View.GONE
                }
            } catch (e: Exception) {
                Log.e("BlogDetail", "Error loading blog post image", e)
                ivBlogImage.visibility = View.GONE
            }
            
            // Update like count and button state
            tvLikeCount.text = post.likeCount.toString()
            
            val currentUserId = FirebaseAuth.getInstance().currentUser?.uid
            val isLiked = currentUserId?.let { post.likedBy.contains(it) } ?: false
            btnLike.setImageResource(
                if (isLiked) R.drawable.ic_favorite_filled 
                else R.drawable.ic_favorite_border
            )
            
            // Update save button state
            val isSaved = currentUserId?.let { post.savedBy.contains(it) } ?: false
            btnSave.setImageResource(
                if (isSaved) R.drawable.ic_bookmark_filled 
                else R.drawable.ic_bookmark_border
            )
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
