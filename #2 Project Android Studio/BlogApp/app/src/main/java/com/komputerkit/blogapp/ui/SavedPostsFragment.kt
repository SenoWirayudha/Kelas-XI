package com.komputerkit.blogapp.ui

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.blogapp.R
import com.komputerkit.blogapp.adapter.BlogPostAdapter
import com.komputerkit.blogapp.data.BlogPost
import com.komputerkit.blogapp.databinding.FragmentSavedPostsBinding
import com.komputerkit.blogapp.viewmodel.BlogViewModel

class SavedPostsFragment : Fragment() {

    private var _binding: FragmentSavedPostsBinding? = null
    private val binding get() = _binding!!
    private val blogViewModel: BlogViewModel by viewModels()
    private lateinit var adapter: BlogPostAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSavedPostsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupToolbar()
        setupRecyclerView()
        setupSwipeRefresh()
        observeViewModel()
        loadSavedPosts()
    }

    private fun setupToolbar() {
        try {
            binding.toolbar.setNavigationOnClickListener {
                try {
                    if (isAdded && view != null) {
                        findNavController().navigateUp()
                    }
                } catch (e: Exception) {
                    Log.e("SavedPosts", "Navigation up failed", e)
                    // Try alternative navigation
                    try {
                        requireActivity().onBackPressed()
                    } catch (ex: Exception) {
                        Log.e("SavedPosts", "Back press failed", ex)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("SavedPosts", "Error setting up toolbar", e)
        }
    }

    private fun setupRecyclerView() {
        val currentUserId = FirebaseAuth.getInstance().currentUser?.uid
        
        adapter = BlogPostAdapter(
            onItemClick = { post -> onPostClick(post) },
            onLikeClick = { post -> onLikeClick(post) },
            onSaveClick = { post -> onSaveClick(post) },
            currentUserId = currentUserId
        )
        
        binding.rvSavedPosts.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@SavedPostsFragment.adapter
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener {
            loadSavedPosts()
        }
    }

    private fun observeViewModel() {
        blogViewModel.savedPosts.observe(viewLifecycleOwner) { posts ->
            adapter.submitList(posts)
            binding.swipeRefresh.isRefreshing = false
            
            if (posts.isEmpty()) {
                binding.tvEmptyState.visibility = View.VISIBLE
                binding.rvSavedPosts.visibility = View.GONE
            } else {
                binding.tvEmptyState.visibility = View.GONE
                binding.rvSavedPosts.visibility = View.VISIBLE
            }
        }

        blogViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                blogViewModel.clearError()
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun loadSavedPosts() {
        try {
            val currentUserId = FirebaseAuth.getInstance().currentUser?.uid
            currentUserId?.let { userId ->
                if (isAdded && view != null) {
                    blogViewModel.loadSavedPosts(userId)
                } else {
                    Log.w("SavedPosts", "Fragment not attached, skipping load")
                }
            } ?: run {
                Log.e("SavedPosts", "No authenticated user")
                if (isAdded) {
                    Toast.makeText(requireContext(), "Please login to view saved posts", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (e: Exception) {
            Log.e("SavedPosts", "Error loading saved posts", e)
            if (isAdded) {
                Toast.makeText(requireContext(), "Error loading saved posts: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun onPostClick(post: BlogPost) {
        Log.d("SavedPosts", "Post clicked: id=${post.id}, authorId=${post.authorId}")
        
        // Add null checks to prevent crashes
        if (post.id.isNotEmpty() && post.authorId.isNotEmpty()) {
            val bundle = Bundle().apply {
                putString("postId", post.id)
                putString("userId", post.authorId)
                putBoolean("canEdit", false)
            }
            Log.d("SavedPosts", "Navigating to blog detail with postId=${post.id}")
            try {
                findNavController().navigate(R.id.action_saved_posts_to_blog_detail, bundle)
            } catch (e: Exception) {
                Log.e("SavedPosts", "Navigation failed", e)
                Toast.makeText(requireContext(), "Error opening post: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        } else {
            Log.e("SavedPosts", "Invalid post data: id=${post.id}, authorId=${post.authorId}")
            Toast.makeText(requireContext(), "Invalid post data", Toast.LENGTH_SHORT).show()
        }
    }

    private fun onLikeClick(post: BlogPost) {
        if (post.id.isNotEmpty()) {
            blogViewModel.toggleLike(post.id)
        }
    }

    private fun onSaveClick(post: BlogPost) {
        if (post.id.isNotEmpty()) {
            blogViewModel.toggleSave(post.id)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
