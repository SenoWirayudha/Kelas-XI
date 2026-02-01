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
import androidx.recyclerview.widget.GridLayoutManager
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentProfileNewBinding
import com.komputerkit.moview.util.TmdbImageUrl

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileNewBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: ProfileViewModel by viewModels()
    
    private lateinit var favoriteMovieAdapter: FavoriteMovieAdapter
    private lateinit var recentActivityAdapter: RecentActivityAdapter

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
        
        setupRecyclerViews()
        setupObservers()
        setupClickListeners()
        setupScrollListener()
        setupNavigationResultListener()
    }
    
    override fun onResume() {
        super.onResume()
        // Reload profile photo every time fragment becomes visible
        reloadProfilePhotoFromPrefs()
    }
    
    private fun setupNavigationResultListener() {
        // Listen for profile update notification from EditProfileFragment
        findNavController().currentBackStackEntry?.savedStateHandle?.let { savedStateHandle ->
            savedStateHandle.getLiveData<Boolean>("profile_updated").observe(viewLifecycleOwner) { updated ->
                if (updated == true) {
                    // Reload profile data from API
                    viewModel.reloadProfile()
                    
                    // Get the profile photo URL directly from savedStateHandle
                    val photoUrl = savedStateHandle.get<String>("profile_photo_url")
                    Log.d("ProfileFragment", "Received profile_photo_url: $photoUrl")
                    
                    if (!photoUrl.isNullOrBlank()) {
                        // Load the new photo directly
                        Glide.with(this@ProfileFragment)
                            .load(photoUrl)
                            .skipMemoryCache(true)
                            .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.NONE)
                            .placeholder(R.drawable.ic_default_profile)
                            .error(R.drawable.ic_default_profile)
                            .circleCrop()
                            .into(binding.ivProfilePhoto)
                    }
                    
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
        
        if (!profilePhotoUrl.isNullOrBlank()) {
            Glide.with(this)
                .load(profilePhotoUrl)
                .skipMemoryCache(true) // Skip cache to get fresh image
                .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.NONE)
                .placeholder(R.drawable.ic_default_profile)
                .error(R.drawable.ic_default_profile)
                .circleCrop()
                .into(binding.ivProfilePhoto)
        } else {
            binding.ivProfilePhoto.setImageResource(R.drawable.ic_default_profile)
        }
    }
    
    private fun setupRecyclerViews() {
        // Favorites - Grid with 4 columns
        favoriteMovieAdapter = FavoriteMovieAdapter(
            onMovieClick = { movie ->
                val action = ProfileFragmentDirections.actionProfileToMovieDetail(movie.id)
                findNavController().navigate(action)
            }
        )
        binding.rvFavorites.apply {
            adapter = favoriteMovieAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
            isNestedScrollingEnabled = false
        }
        
        // Recent Activity - Grid with 4 columns
        recentActivityAdapter = RecentActivityAdapter()
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
        
        // Profile photo dari API
        viewModel.profilePhotoUrl.observe(viewLifecycleOwner) { photoUrl ->
            if (!photoUrl.isNullOrBlank()) {
                Glide.with(this)
                    .load(photoUrl)
                    .placeholder(R.drawable.ic_default_profile)
                    .error(R.drawable.ic_default_profile)
                    .circleCrop()
                    .into(binding.ivProfilePhoto)
            } else {
                // Use default profile icon
                binding.ivProfilePhoto.setImageResource(R.drawable.ic_default_profile)
            }
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
        binding.btnSettings.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToEditProfile()
            findNavController().navigate(action)
        }
        
        binding.layoutFilms.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToFilms()
            findNavController().navigate(action)
        }
        
        binding.layoutDiary.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToDiary()
            findNavController().navigate(action)
        }
        
        binding.layoutReviews.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToReview()
            findNavController().navigate(action)
        }
        
        binding.layoutWatchlist.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToWatchlist()
            findNavController().navigate(action)
        }
        
        binding.layoutLikes.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToLikes()
            findNavController().navigate(action)
        }
        
        binding.layoutFollowers.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToFollowers()
            findNavController().navigate(action)
        }
        
        binding.layoutFollowing.setOnClickListener {
            val action = ProfileFragmentDirections.actionProfileToFollowing()
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
