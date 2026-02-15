package com.komputerkit.moview.ui.social

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
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
        setupClickListeners()
        observeViewModel()
    }
    
    private fun setupRecyclerView() {
        adapter = UserAdapter { user ->
            navigateToUserProfile(user)
        }
        
        binding.rvUsers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvUsers.adapter = adapter
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun observeViewModel() {
        viewModel.followers.observe(viewLifecycleOwner) { users ->
            adapter.submitList(users)
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
