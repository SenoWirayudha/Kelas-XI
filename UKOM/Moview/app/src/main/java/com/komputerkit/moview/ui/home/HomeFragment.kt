package com.komputerkit.moview.ui.home

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.komputerkit.moview.databinding.FragmentHomeNewBinding

class HomeFragment : Fragment(), SwipeRefreshLayout.OnRefreshListener {

    private var _binding: FragmentHomeNewBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: HomeViewModel by viewModels()
    
    private lateinit var movieCardAdapter: MovieCardAdapter
    private lateinit var friendActivityAdapter: FriendActivityNewAdapter
    private lateinit var nowShowingAdapter: TheatricalMovieAdapter
    private lateinit var upcomingAdapter: TheatricalMovieAdapter
    private lateinit var academyAwardAdapter: MovieCardAdapter

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
        setupSwipeRefresh()
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
            },
            onProfileClick = { activity ->
                try {
                    val action = HomeFragmentDirections.actionHomeToProfile(activity.user.id)
                    findNavController().navigate(action)
                } catch (e: Exception) {
                    android.util.Log.e("HomeFragment", "Profile navigation error", e)
                }
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

        // Setup Now Showing RecyclerView (Horizontal)
        nowShowingAdapter = TheatricalMovieAdapter(
            onMovieClick = { movie ->
                val action = HomeFragmentDirections.actionHomeToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            onBuyTicketClick = { openTixIdApp() }
        )
        binding.rvNowShowing.apply {
            adapter = nowShowingAdapter
            layoutManager = LinearLayoutManager(
                requireContext(), LinearLayoutManager.HORIZONTAL, false
            )
        }

        // Setup Upcoming RecyclerView (Horizontal)
        upcomingAdapter = TheatricalMovieAdapter(
            onMovieClick = { movie ->
                val action = HomeFragmentDirections.actionHomeToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            showDateBadge = true
        )
        binding.rvUpcoming.apply {
            adapter = upcomingAdapter
            layoutManager = LinearLayoutManager(
                requireContext(), LinearLayoutManager.HORIZONTAL, false
            )
        }

        // Setup Academy Award RecyclerView (Horizontal)
        academyAwardAdapter = MovieCardAdapter(
            onMovieClick = { movie ->
                val action = HomeFragmentDirections.actionHomeToMovieDetail(movie.id)
                findNavController().navigate(action)
            }
        )
        binding.rvAcademyAward.apply {
            adapter = academyAwardAdapter
            layoutManager = LinearLayoutManager(
                requireContext(), LinearLayoutManager.HORIZONTAL, false
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
        
        viewModel.nowShowingMovies.observe(viewLifecycleOwner) { movies ->
            nowShowingAdapter.submitList(movies)
        }

        viewModel.upcomingMovies.observe(viewLifecycleOwner) { movies ->
            upcomingAdapter.submitList(movies)
        }

        viewModel.academyAwardMovies.observe(viewLifecycleOwner) { movies ->
            academyAwardAdapter.submitList(movies)
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                android.util.Log.e("HomeFragment", "Error loading data: $it")
                Toast.makeText(requireContext(), it, Toast.LENGTH_SHORT).show()
            }
        }
        
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.swipeRefresh.isRefreshing = isLoading
        }
    }
    
    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener(this)
    }
    
    private fun setupClickListeners() {
        binding.btnSeeAll.setOnClickListener {
            android.util.Log.d("HomeFragment", "See All Popular clicked")
            val action = HomeFragmentDirections.actionHomeToPopularMovies()
            findNavController().navigate(action)
        }
        
        binding.btnSeeAllFriends.setOnClickListener {
            android.util.Log.d("HomeFragment", "See All Friends clicked")
            val action = HomeFragmentDirections.actionHomeToFriendActivities()
            findNavController().navigate(action)
        }
        binding.btnSeeAllNowShowing.setOnClickListener {
            val action = HomeFragmentDirections.actionHomeToNowShowing()
            findNavController().navigate(action)
        }

        binding.btnSeeAllUpcoming.setOnClickListener {
            val action = HomeFragmentDirections.actionHomeToUpcoming()
            findNavController().navigate(action)
        }
    }

    override fun onRefresh() {
        android.util.Log.d("HomeFragment", "Refreshing home data")
        viewModel.refreshData()
    }

    private fun openTixIdApp() {
        val url = "https://app.tix.id/cities"
        val tixPackage = "id.tix.app"
        try {
            requireContext().packageManager.getPackageInfo(tixPackage, 0)
            // TIX ID is installed — open it directly
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                setPackage(tixPackage)
            }
            startActivity(intent)
        } catch (e: PackageManager.NameNotFoundException) {
            // Not installed — fall back to browser
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
