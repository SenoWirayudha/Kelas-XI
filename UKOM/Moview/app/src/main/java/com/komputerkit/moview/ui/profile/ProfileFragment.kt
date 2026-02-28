package com.komputerkit.moview.ui.profile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentProfileNewBinding
import com.komputerkit.moview.util.TmdbImageUrl
import com.komputerkit.moview.util.loadProfilePhoto

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileNewBinding? = null
    private val binding get() = _binding!!
    
    private val args: ProfileFragmentArgs by navArgs()
    private val viewModel: ProfileViewModel by viewModels()
    
    private lateinit var favoriteMovieAdapter: FavoriteMovieAdapter
    private lateinit var recentActivityAdapter: RecentActivityAdapter
    
    private var isOwnProfile = true
    private var targetUserId = 0
    private var isFollowing = false

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileNewBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Determine if viewing own profile or another user's
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        targetUserId = args.userId
        
        // If userId is 0 or same as current user, show own profile
        isOwnProfile = targetUserId == 0 || targetUserId == currentUserId
        
        if (isOwnProfile) {
            targetUserId = currentUserId
        }
        
        setupUI()
        setupRecyclerViews()
        setupObservers()
        setupClickListeners()
        setupScrollListener()
        setupNavigationResultListener()
        
        // Load profile data
        viewModel.loadProfileData(targetUserId)
        
        // Check follow status if viewing another user's profile
        if (!isOwnProfile) {
            val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
            val currentUserId = prefs.getInt("userId", 0)
            Log.d("ProfileFragment", "Checking follow status: currentUser=$currentUserId, target=$targetUserId")
            viewModel.checkFollowStatus(currentUserId, targetUserId)
        }
    }
    
    override fun onResume() {
        super.onResume()
        Log.d("ProfileFragment", "onResume() - Reloading profile data")
        
        // Re-calculate isOwnProfile and targetUserId in case user switched accounts
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val requestedUserId = args.userId
        
        // If userId is 0 or same as current user, show own profile
        isOwnProfile = requestedUserId == 0 || requestedUserId == currentUserId
        targetUserId = if (isOwnProfile) currentUserId else requestedUserId
        
        Log.d("ProfileFragment", "onResume() - currentUserId: $currentUserId, requestedUserId: $requestedUserId, targetUserId: $targetUserId, isOwnProfile: $isOwnProfile")
        
        // Reload profile data with correct userId
        viewModel.loadProfileData(targetUserId)
        
        // Reload follow status if viewing another user's profile
        if (!isOwnProfile) {
            viewModel.checkFollowStatus(currentUserId, targetUserId)
        }
    }
    
    private fun setupUI() {
        // Show/hide buttons based on whether viewing own profile and navigation source
        if (isOwnProfile) {
            // Own profile
            if (args.userId == 0) {
                // Opened from bottom nav (args.userId defaults to 0) - hide back, show settings
                binding.btnBack.visibility = View.GONE
                binding.btnSettings.visibility = View.VISIBLE
            } else {
                // Navigated from followers/following/etc (args.userId explicitly set) - show back, hide settings
                binding.btnBack.visibility = View.VISIBLE
                binding.btnSettings.visibility = View.GONE
            }
            binding.btnFollow.visibility = View.GONE
        } else {
            // Other user's profile - show back and follow, hide settings
            binding.btnBack.visibility = View.VISIBLE
            binding.btnFollow.visibility = View.VISIBLE
            binding.btnSettings.visibility = View.GONE
        }
        
        // Initialize follow button state
        if (!isOwnProfile) {
            updateFollowButton()
        }
    }
    
    private fun setupNavigationResultListener() {
        // Listen for profile update notification from EditProfileFragment
        findNavController().currentBackStackEntry?.savedStateHandle?.let { savedStateHandle ->
            savedStateHandle.getLiveData<Boolean>("profile_updated").observe(viewLifecycleOwner) { updated ->
                if (updated == true) {
                    // Reload profile data from API (use targetUserId which is set in onViewCreated/onResume)
                    viewModel.loadProfileData(targetUserId)
                    
                    // Get the profile photo URL directly from savedStateHandle
                    val photoUrl = savedStateHandle.get<String>("profile_photo_url")
                    Log.d("ProfileFragment", "Received profile_photo_url: $photoUrl")
                    
                    // Load the new photo using same strategy as poster/backdrop
                    binding.ivProfilePhoto.loadProfilePhoto(photoUrl)
                    
                    // Clear the flags
                    savedStateHandle.remove<Boolean>("profile_updated")
                    savedStateHandle.remove<String>("profile_photo_url")
                }
            }
        }
    }
    
    private fun reloadProfilePhotoFromPrefs() {
        if (!isAdded || _binding == null) return
        
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
        val profilePhotoUrl = prefs.getString("profilePhotoUrl", null)
        
        Log.d("ProfileFragment", "reloadProfilePhotoFromPrefs: URL = $profilePhotoUrl")
        
        // Use same loading strategy as poster/backdrop for reliability
        binding.ivProfilePhoto.loadProfilePhoto(profilePhotoUrl)
    }
    
    private fun setupRecyclerViews() {
        // Favorites - Grid with 4 columns
        favoriteMovieAdapter = FavoriteMovieAdapter(
            onMovieClick = { movie ->
                val action = ProfileFragmentDirections.actionProfileToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            onReviewClick = { reviewId ->
                val action = ProfileFragmentDirections.actionProfileToReviewDetail(
                    reviewId = reviewId,
                    isLog = false
                )
                findNavController().navigate(action)
            }
        )
        binding.rvFavorites.apply {
            adapter = favoriteMovieAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
            isNestedScrollingEnabled = false
        }
        
        // Recent Activity - Grid with 4 columns
        recentActivityAdapter = RecentActivityAdapter(
            onMovieClick = { entry ->
                val action = ProfileFragmentDirections.actionProfileToMovieDetail(entry.movie.id)
                findNavController().navigate(action)
            },
            onLongPressGoToFilm = { entry ->
                val action = ProfileFragmentDirections.actionProfileToMovieDetail(entry.movie.id)
                findNavController().navigate(action)
            },
            onReviewClick = { reviewId ->
                val action = ProfileFragmentDirections.actionProfileToReviewDetail(
                    reviewId = reviewId,
                    isLog = false
                )
                findNavController().navigate(action)
            }
        )
        binding.rvRecentActivity.apply {
            adapter = recentActivityAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
            isNestedScrollingEnabled = false
        }
    }
    
    private fun setupObservers() {
        viewModel.userName.observe(viewLifecycleOwner) { name ->
            Log.d("ProfileFragment", "Username observed: $name")
            binding.tvUserName.text = name
            binding.tvToolbarName.text = name  // Set toolbar name
        }
        
        viewModel.bio.observe(viewLifecycleOwner) { bio ->
            binding.tvBio.text = bio
            // Hide bio section if empty
            binding.tvBio.visibility = if (bio.isNullOrBlank()) View.GONE else View.VISIBLE
        }
        
        viewModel.location.observe(viewLifecycleOwner) { location ->
            binding.tvLocation.text = location
            // Hide location if empty
            binding.tvLocation.visibility = if (location.isNullOrBlank()) View.GONE else View.VISIBLE
        }
        
        viewModel.favoriteMovies.observe(viewLifecycleOwner) { movies ->
            favoriteMovieAdapter.submitList(movies)
        }
        
        viewModel.recentActivity.observe(viewLifecycleOwner) { activities ->
            recentActivityAdapter.submitList(activities)
        }
        
        viewModel.stats.observe(viewLifecycleOwner) { stats ->
            updateStats(stats)
        }
        
        // Profile photo dari API - use same loading strategy as poster/backdrop
        viewModel.profilePhotoUrl.observe(viewLifecycleOwner) { photoUrl ->
            Log.d("ProfileFragment", "Profile photo URL changed: $photoUrl")
            binding.ivProfilePhoto.loadProfilePhoto(photoUrl)
        }
        
        // Header background dari API dengan layout adjustment
        viewModel.backdropUrl.observe(viewLifecycleOwner) { backdropUrl ->
            val backdropContainer = binding.root.findViewById<View>(R.id.backdrop_container)
            val profilePhotoContainer = binding.root.findViewById<View>(R.id.profile_photo_container)
            
            if (!backdropUrl.isNullOrBlank()) {
                // Ada backdrop - tampilkan backdrop container
                if (backdropContainer != null) {
                    backdropContainer.visibility = View.VISIBLE
                    val params = backdropContainer.layoutParams
                    params.height = (200 * resources.displayMetrics.density).toInt()
                    backdropContainer.layoutParams = params
                }
                
                // Load backdrop image
                Glide.with(this)
                    .load(backdropUrl)
                    .into(binding.ivHeaderBg)
                
                // Profile photo overlap dengan backdrop
                if (profilePhotoContainer != null) {
                    val photoParams = profilePhotoContainer.layoutParams as ViewGroup.MarginLayoutParams
                    photoParams.topMargin = (-48 * resources.displayMetrics.density).toInt()
                    profilePhotoContainer.layoutParams = photoParams
                }
            } else {
                // Tidak ada backdrop - hide backdrop container, layout seperti Letterboxd
                if (backdropContainer != null) {
                    backdropContainer.visibility = View.GONE
                }
                
                // Profile photo tanpa overlap, margin top normal
                if (profilePhotoContainer != null) {
                    val photoParams = profilePhotoContainer.layoutParams as ViewGroup.MarginLayoutParams
                    photoParams.topMargin = (24 * resources.displayMetrics.density).toInt()
                    profilePhotoContainer.layoutParams = photoParams
                }
            }
        }
        
        // Observe follow status
        viewModel.isFollowing.observe(viewLifecycleOwner) { following ->
            Log.d("ProfileFragment", "Follow status changed: $following")
            isFollowing = following
            updateFollowButton()
        }
        
        // Observe follow action result
        viewModel.followActionResult.observe(viewLifecycleOwner) { result ->
            result?.let {
                when (it) {
                    is FollowActionResult.Success -> {
                        val message = if (it.isFollowing) "Following" else "Unfollowed"
                        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
                    }
                    is FollowActionResult.Error -> {
                        Toast.makeText(requireContext(), it.message, Toast.LENGTH_SHORT).show()
                    }
                }
                // Clear the result after processing
                viewModel.clearFollowActionResult()
            }
        }
    }
    
    private fun updateStats(stats: UserStats) {
        // Stats numbers
        binding.tvFilmsCount.text = formatNumber(stats.films)
        binding.tvDiaryCount.text = formatNumber(stats.diary)
        binding.tvReviewsCount.text = formatNumber(stats.reviews)
        binding.tvWatchlistCount.text = formatNumber(stats.watchlist)
        binding.tvLikesCount.text = formatNumber(stats.likes)
        binding.tvFollowersCount.text = formatNumber(stats.followers)
        binding.tvFollowingCount.text = formatNumber(stats.following)
        
        // Ratings distribution
        binding.progress5Star.progress = stats.rating5
        binding.progress4Star.progress = stats.rating4
        binding.progress3Star.progress = stats.rating3
        binding.progress2Star.progress = stats.rating2
        binding.progress1Star.progress = stats.rating1
        
        binding.tvTotalRatings.text = "TOTAL RATINGS: ${stats.totalRatings}"
    }
    
    private fun formatNumber(num: Int): String {
        return when {
            num >= 1000 -> String.format("%.1fk", num / 1000.0).replace(".0k", "k")
            else -> num.toString()
        }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.btnFollow.setOnClickListener {
            toggleFollow()
        }
        
        binding.btnSettings.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToEditProfile()
            findNavController().navigate(action)
        }
        
        // "More" button for recent activity → navigate to diary
        binding.btnMoreActivity.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToDiary(targetUserId)
            findNavController().navigate(action)
        }
        
        binding.layoutFilms.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToFilms(targetUserId)
            findNavController().navigate(action)
        }
        
        binding.layoutDiary.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToDiary(targetUserId)
            findNavController().navigate(action)
        }
        
        binding.layoutReviews.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToReview(targetUserId)
            findNavController().navigate(action)
        }
        
        binding.layoutWatchlist.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToWatchlist(targetUserId)
            findNavController().navigate(action)
        }
        
        binding.layoutLikes.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToLikes(targetUserId)
            findNavController().navigate(action)
        }
        
        binding.layoutFollowers.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToFollowers(targetUserId)
            findNavController().navigate(action)
        }
        
        binding.layoutFollowing.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToFollowing(targetUserId)
            findNavController().navigate(action)
        }
    }
    
    private fun setupScrollListener() {
        binding.scrollView.setOnScrollChangeListener { _, _, scrollY, _, _ ->
            // Threshold untuk menampilkan nama di toolbar (200dp dari header background)
            val threshold = 200 * resources.displayMetrics.density
            
            if (scrollY > threshold) {
                // Show name in toolbar with fade in
                binding.tvToolbarName.animate()
                    .alpha(1f)
                    .setDuration(200)
                    .start()
            } else {
                // Hide name in toolbar with fade out
                binding.tvToolbarName.animate()
                    .alpha(0f)
                    .setDuration(200)
                    .start()
            }
        }
    }
    
    private fun toggleFollow() {
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        
        if (currentUserId == 0 || targetUserId == 0) {
            Toast.makeText(requireContext(), "Unable to follow user", Toast.LENGTH_SHORT).show()
            return
        }
        
        viewModel.toggleFollow(currentUserId, targetUserId)
    }
    
    private fun updateFollowButton() {
        Log.d("ProfileFragment", "Updating follow button. isFollowing = $isFollowing")
        if (isFollowing) {
            // Following state: green solid background, no border
            binding.btnFollow.text = "FOLLOWING"
            binding.btnFollow.setBackgroundColor(resources.getColor(R.color.star_green, null))
            binding.btnFollow.strokeWidth = 0
            binding.btnFollow.setTextColor(resources.getColor(R.color.white, null))
            Log.d("ProfileFragment", "Button set to FOLLOWING (green)")
        } else {
            // Follow state: transparent background with white border
            binding.btnFollow.text = "FOLLOW"
            binding.btnFollow.setBackgroundColor(resources.getColor(android.R.color.transparent, null))
            binding.btnFollow.strokeWidth = (1 * resources.displayMetrics.density).toInt()
            binding.btnFollow.strokeColor = resources.getColorStateList(R.color.white, null)
            binding.btnFollow.setTextColor(resources.getColor(R.color.white, null))
            Log.d("ProfileFragment", "Button set to FOLLOW (transparent border)")
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
