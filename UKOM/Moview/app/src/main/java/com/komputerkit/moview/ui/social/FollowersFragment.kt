package com.komputerkit.moview.ui.social

import android.content.Context
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.data.model.UserProfile
import com.komputerkit.moview.databinding.FragmentFollowersBinding

class FollowersFragment : Fragment() {

    private var _binding: FragmentFollowersBinding? = null
    private val binding get() = _binding!!
    private val args: FollowersFragmentArgs by navArgs()
    
    private val viewModel: FollowersViewModel by viewModels()
    private lateinit var adapter: UserAdapter

    private var allUsers: List<UserProfile> = emptyList()
    private var searchQuery: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFollowersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        viewModel.loadFollowers(targetUserId)
        
        setupRecyclerView()
        setupSearch()
        setupClickListeners()
        observeViewModel()
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                searchQuery = s?.toString().orEmpty()
                binding.btnClear.isVisible = searchQuery.isNotEmpty()
                applyFilter()
            }
        })
        binding.btnClear.setOnClickListener { binding.etSearch.setText("") }
    }

    private fun applyFilter() {
        val query = searchQuery.trim()
        val filtered = if (query.isEmpty()) {
            allUsers
        } else {
            allUsers.filter { it.username.contains(query, ignoreCase = true) }
        }
        adapter.submitList(filtered)
        binding.tvEmpty.text =
            if (allUsers.isEmpty()) "No followers yet" else "No users found"
        binding.tvEmpty.isVisible = filtered.isEmpty()
    }
    
    override fun onResume() {
        super.onResume()
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        viewModel.loadFollowers(targetUserId)
    }
    
    private fun setupRecyclerView() {
        adapter = UserAdapter(
            onUserClick = { user -> navigateToUserProfile(user) },
            onFollowToggle = { user -> viewModel.toggleFollow(user) }
        )
        
        binding.rvUsers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvUsers.adapter = adapter
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun observeViewModel() {
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }
        viewModel.followers.observe(viewLifecycleOwner) { users ->
            allUsers = users
            applyFilter()
        }
    }
    
    private fun navigateToUserProfile(user: UserProfile) {
        // Get current user ID from SharedPreferences
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        
        // Navigate to profile with the user's ID
        // If it's the current user, ProfileFragment will hide the follow button
        // If it's another user, ProfileFragment will show the follow button
        val action = FollowersFragmentDirections.actionFollowersToProfile(user.id)
        findNavController().navigate(action)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
