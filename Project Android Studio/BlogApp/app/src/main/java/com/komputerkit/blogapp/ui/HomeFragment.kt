package com.komputerkit.blogapp.ui

import android.os.Bundle
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
import com.komputerkit.blogapp.databinding.FragmentHomeBinding
import com.komputerkit.blogapp.viewmodel.BlogViewModel

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private val blogViewModel: BlogViewModel by viewModels()
    private lateinit var adapter: BlogPostAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupClickListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        val currentUserId = FirebaseAuth.getInstance().currentUser?.uid
        
        adapter = BlogPostAdapter(
            onItemClick = { post -> onPostClick(post) },
            onLikeClick = { post -> onLikeClick(post) },
            onSaveClick = { post -> onSaveClick(post) },
            currentUserId = currentUserId
        )
        
        binding.rvPosts.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@HomeFragment.adapter
        }
    }

    private fun setupClickListeners() {
        binding.fabCreatePost.setOnClickListener {
            findNavController().navigate(R.id.action_home_to_create_post)
        }

        binding.swipeRefresh.setOnRefreshListener {
            // Refresh will be handled automatically by the ViewModel
            binding.swipeRefresh.isRefreshing = false
        }
    }

    private fun observeViewModel() {
        blogViewModel.posts.observe(viewLifecycleOwner) { posts ->
            adapter.submitList(posts)
            
            if (posts.isEmpty()) {
                binding.tvEmptyState.visibility = View.VISIBLE
                binding.rvPosts.visibility = View.GONE
            } else {
                binding.tvEmptyState.visibility = View.GONE
                binding.rvPosts.visibility = View.VISIBLE
            }
        }

        blogViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                blogViewModel.clearError()
            }
        }
    }

    private fun onPostClick(post: BlogPost) {
        val action = HomeFragmentDirections
            .actionHomeToBlogDetail(post.id, post.authorId, false)
        findNavController().navigate(action)
    }

    private fun onLikeClick(post: BlogPost) {
        blogViewModel.toggleLike(post.id)
    }

    private fun onSaveClick(post: BlogPost) {
        blogViewModel.toggleSave(post.id)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
