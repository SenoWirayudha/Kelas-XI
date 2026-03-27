package com.komputerkit.moview.ui.watched

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.tabs.TabLayout
import com.komputerkit.moview.databinding.FragmentMovieWatchedUsersBinding

class MovieWatchedUsersFragment : Fragment() {

    private var _binding: FragmentMovieWatchedUsersBinding? = null
    private val binding get() = _binding!!

    private val args: MovieWatchedUsersFragmentArgs by navArgs()
    private val viewModel: MovieWatchedUsersViewModel by viewModels()

    private lateinit var adapter: MovieWatchedUsersAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMovieWatchedUsersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupToolbar()
        setupTabs()
        setupRecycler()
        setupObservers()

        when (args.initialTab.lowercase()) {
            "liked" -> binding.tabLayout.getTabAt(1)?.select()
            "friends" -> binding.tabLayout.getTabAt(2)?.select()
            else -> {
                binding.tabLayout.getTabAt(0)?.select()
                viewModel.loadUsers(args.movieId, WatchedUsersFilter.EVERYONE, args.entrySource)
            }
        }
    }

    private fun setupToolbar() {
        binding.tvTitle.text = args.movieTitle
        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
    }

    private fun setupTabs() {
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Everyone"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Liked"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Friends"))

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                val filter = when (tab.position) {
                    1 -> WatchedUsersFilter.LIKED
                    2 -> WatchedUsersFilter.FRIENDS
                    else -> WatchedUsersFilter.EVERYONE
                }
                viewModel.loadUsers(args.movieId, filter, args.entrySource)
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) = Unit
            override fun onTabReselected(tab: TabLayout.Tab?) = Unit
        })
    }

    private fun setupRecycler() {
        adapter = MovieWatchedUsersAdapter { item ->
            if (item.hasReview && (item.reviewId ?: 0) > 0) {
                val action = MovieWatchedUsersFragmentDirections
                    .actionMovieWatchedUsersToReviewDetail(item.reviewId ?: 0, false)
                findNavController().navigate(action)
            } else {
                val action = MovieWatchedUsersFragmentDirections.actionMovieWatchedUsersToProfile(item.userId)
                findNavController().navigate(action)
            }
        }

        binding.rvUsers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvUsers.adapter = adapter
    }

    private fun setupObservers() {
        viewModel.users.observe(viewLifecycleOwner) { users ->
            adapter.submitList(users)
            binding.tvEmpty.isVisible = users.isEmpty() && viewModel.isLoading.value != true
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.isVisible = isLoading
            binding.rvUsers.isVisible = !isLoading
            if (isLoading) {
                binding.tvEmpty.isVisible = false
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
