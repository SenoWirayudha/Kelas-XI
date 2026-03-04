package com.komputerkit.moview.ui.home

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.databinding.FragmentHomeNewBinding

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeNewBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: HomeViewModel by viewModels()
    
    private lateinit var movieCardAdapter: MovieCardAdapter
    private lateinit var friendActivityAdapter: FriendActivityNewAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeNewBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get user ID from SharedPreferences
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val userId = prefs.getInt("userId", 0)
        android.util.Log.d("HomeFragment", "Retrieved userId from SharedPreferences: $userId")
        
        // Set userId to ViewModel
        viewModel.setUserId(userId)
        
        setupRecyclerViews()
        observeViewModel()
        setupClickListeners()
    }

    private fun setupRecyclerViews() {
        // Setup Popular Movies RecyclerView (Horizontal)
        movieCardAdapter = MovieCardAdapter(
            onMovieClick = { movie ->
                val action = HomeFragmentDirections.actionHomeToMovieDetail(movie.id)
                findNavController().navigate(action)
            }
        )
        binding.rvPopularMovies.apply {
            adapter = movieCardAdapter
            layoutManager = LinearLayoutManager(
                requireContext(),
                LinearLayoutManager.HORIZONTAL,
                false
            )
        }

        // Setup Friend Activities RecyclerView (Horizontal)
        friendActivityAdapter = FriendActivityNewAdapter(
            onActivityClick = { activity ->
                android.util.Log.d("HomeFragment", "")
                android.util.Log.d("HomeFragment", "========================================")
                android.util.Log.d("HomeFragment", "=== CALLBACK INVOKED IN HOME FRAGMENT ===")
                android.util.Log.d("HomeFragment", "========================================")
                
                try {
                    android.util.Log.d("HomeFragment", "Activity received: ID=${activity.id}, Type=${activity.activityType}")
                    android.util.Log.d("HomeFragment", "hasReview=${activity.hasReview}, reviewId=${activity.reviewId}, diaryId=${activity.diaryId}")
                    android.util.Log.d("HomeFragment", "User: ${activity.user.username}, Movie: ${activity.movie.title}")
                    
                    // Navigate to Review Detail for both diary and review
                    val reviewId = if (activity.hasReview) activity.reviewId else activity.diaryId
                    val isLog = !activity.hasReview
                    
                    android.util.Log.d("HomeFragment", "Calculated: reviewId=$reviewId, isLog=$isLog")
                    
                    if (reviewId > 0) {
                        android.util.Log.d("HomeFragment", "ReviewId is valid, creating navigation action...")
                        val action = HomeFragmentDirections.actionHomeToReviewDetail(
                            reviewId = reviewId,
                            isLog = isLog
                        )
                        android.util.Log.d("HomeFragment", "Navigation action created successfully")
                        android.util.Log.d("HomeFragment", "Calling findNavController().navigate()...")
                        findNavController().navigate(action)
                        android.util.Log.d("HomeFragment", "Navigation command executed!")
                    } else {
                        android.util.Log.e("HomeFragment", "ERROR: Invalid reviewId: $reviewId")
                        Toast.makeText(requireContext(), "Cannot open this activity (invalid ID)", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    android.util.Log.e("HomeFragment", "!!! EXCEPTION IN CALLBACK !!!", e)
                    e.printStackTrace()
                    Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
                
                android.util.Log.d("HomeFragment", "========================================")
            }
        )
        binding.rvFriendActivities.apply {
            adapter = friendActivityAdapter
            layoutManager = LinearLayoutManager(
                requireContext(),
                LinearLayoutManager.HORIZONTAL,
                false
            )
        }
    }

    private fun observeViewModel() {
        viewModel.popularMovies.observe(viewLifecycleOwner) { movies ->
            android.util.Log.d("HomeFragment", "Popular movies received: ${movies.size} items")
            movieCardAdapter.submitList(movies)
        }

        viewModel.friendActivities.observe(viewLifecycleOwner) { activities ->
            android.util.Log.d("HomeFragment", "Friend activities received: ${activities.size} items")
            if (activities.isEmpty()) {
                android.util.Log.d("HomeFragment", "No friend activities to display")
                binding.rvFriendActivities.visibility = View.GONE
            } else {
                android.util.Log.d("HomeFragment", "Displaying ${activities.size} friend activities")
                binding.rvFriendActivities.visibility = View.VISIBLE
                friendActivityAdapter.submitList(activities)
            }
        }
        
        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                android.util.Log.e("HomeFragment", "Error loading data: $it")
                Toast.makeText(requireContext(), it, Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnSeeAll.setOnClickListener {
            Toast.makeText(requireContext(), "See All Popular Movies", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
