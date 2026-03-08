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
import androidx.recyclerview.widget.GridLayoutManager
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.komputerkit.moview.databinding.FragmentFriendActivitiesBinding

class FriendActivitiesFragment : Fragment(), SwipeRefreshLayout.OnRefreshListener {

    private var _binding: FragmentFriendActivitiesBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: FriendActivitiesViewModel by viewModels()
    private lateinit var adapter: FriendActivityGridAdapter
    private var userId: Int = 0

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFriendActivitiesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get user ID from SharedPreferences
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        userId = prefs.getInt("userId", 0)
        
        setupToolbar()
        setupRecyclerView()
        setupSwipeRefresh()
        observeViewModel()
        
        // Load data
        if (userId > 0) {
            viewModel.loadFriendsActivities(userId)
        } else {
            Toast.makeText(requireContext(), "Please login first", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener(this)
    }

    private fun setupRecyclerView() {
        adapter = FriendActivityGridAdapter(
            onActivityClick = { activity ->
                android.util.Log.d("FriendActivitiesFragment", "Activity clicked: ${activity.id}")
                
                val reviewId = if (activity.hasReview) activity.reviewId else activity.diaryId
                val isLog = !activity.hasReview
                
                if (reviewId > 0) {
                    try {
                        val action = FriendActivitiesFragmentDirections
                            .actionFriendActivitiesToReviewDetail(
                                reviewId = reviewId,
                                isLog = isLog
                            )
                        findNavController().navigate(action)
                    } catch (e: Exception) {
                        android.util.Log.e("FriendActivitiesFragment", "Navigation error", e)
                        Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            onProfileClick = { activity ->
                try {
                    val action = FriendActivitiesFragmentDirections
                        .actionFriendActivitiesToProfile(activity.user.id)
                    findNavController().navigate(action)
                } catch (e: Exception) {
                    android.util.Log.e("FriendActivitiesFragment", "Profile navigation error", e)
                }
            },
            onGoToFilm = { activity ->
                try {
                    val action = FriendActivitiesFragmentDirections
                        .actionFriendActivitiesToMovieDetail(activity.movie.id)
                    findNavController().navigate(action)
                } catch (e: Exception) {
                    android.util.Log.e("FriendActivitiesFragment", "Movie detail navigation error", e)
                }
            },
            onLogFilm = { activity ->
                try {
                    val action = FriendActivitiesFragmentDirections
                        .actionFriendActivitiesToLogFilm(activity.movie.id)
                    findNavController().navigate(action)
                } catch (e: Exception) {
                    android.util.Log.e("FriendActivitiesFragment", "Log film navigation error", e)
                }
            },
            onChangePoster = { activity ->
                try {
                    val action = FriendActivitiesFragmentDirections
                        .actionFriendActivitiesToPosterBackdrop(activity.movie.id, false)
                    findNavController().navigate(action)
                } catch (e: Exception) {
                    android.util.Log.e("FriendActivitiesFragment", "Change poster navigation error", e)
                }
            }
        )
        
        binding.rvFriendActivities.apply {
            val gridLayoutManager = GridLayoutManager(requireContext(), 3)
            layoutManager = gridLayoutManager
            adapter = this@FriendActivitiesFragment.adapter
            
            // Add spacing between items — 12dp to match home "New from Friends" section gap
            val spacingPx = (12 * resources.displayMetrics.density).toInt()
            addItemDecoration(GridSpacingItemDecoration(3, spacingPx, false))
        }
    }
    
    override fun onRefresh() {
        android.util.Log.d("FriendActivitiesFragment", "Refreshing...")
        if (userId > 0) {
            viewModel.loadFriendsActivities(userId)
        } else {
            binding.swipeRefresh.isRefreshing = false
        }
    }

    private fun observeViewModel() {
        viewModel.activities.observe(viewLifecycleOwner) { activities ->
            android.util.Log.d("FriendActivitiesFragment", "Activities received: ${activities.size}")
            
            // Only show empty state when NOT loading (loading finished with empty result)
            if (activities.isEmpty()) {
                if (viewModel.loading.value != true) {
                    binding.emptyState.visibility = View.VISIBLE
                    binding.rvFriendActivities.visibility = View.GONE
                }
            } else {
                binding.emptyState.visibility = View.GONE
                binding.rvFriendActivities.visibility = View.VISIBLE
                adapter.submitList(activities)
            }
        }
        
        viewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading && !binding.swipeRefresh.isRefreshing) View.VISIBLE else View.GONE
            if (!isLoading) {
                binding.swipeRefresh.isRefreshing = false
                // After loading completes, check if we should show empty state
                val currentActivities = viewModel.activities.value
                if (currentActivities != null && currentActivities.isEmpty()) {
                    binding.emptyState.visibility = View.VISIBLE
                    binding.rvFriendActivities.visibility = View.GONE
                }
            }
        }
        
        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                android.util.Log.e("FriendActivitiesFragment", "Error: $it")
                Toast.makeText(requireContext(), it, Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
