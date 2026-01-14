package com.komputerkit.moview.ui.profile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
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
    }
    
    private fun setupRecyclerViews() {
        // Favorites
        favoriteMovieAdapter = FavoriteMovieAdapter { movie ->
            val action = ProfileFragmentDirections.actionProfileToMovieDetail(movie.id)
            findNavController().navigate(action)
        }
        binding.rvFavorites.apply {
            adapter = favoriteMovieAdapter
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }
        
        // Recent Activity
        recentActivityAdapter = RecentActivityAdapter()
        binding.rvRecentActivity.apply {
            adapter = recentActivityAdapter
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }
    }
    
    private fun setupObservers() {
        viewModel.userName.observe(viewLifecycleOwner) { name ->
            binding.tvUserName.text = name
            binding.tvToolbarName.text = name  // Set toolbar name
        }
        
        viewModel.bio.observe(viewLifecycleOwner) { bio ->
            binding.tvBio.text = bio
        }
        
        viewModel.location.observe(viewLifecycleOwner) { location ->
            binding.tvLocation.text = location
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
        
        // Profile photo - use placeholder
        Glide.with(this)
            .load(TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg"))
            .placeholder(R.drawable.ic_profile)
            .error(R.drawable.ic_profile)
            .circleCrop()
            .into(binding.ivProfilePhoto)
        
        // Header background
        Glide.with(this)
            .load(TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT))
            .into(binding.ivHeaderBg)
    }
    
    private fun updateStats(stats: UserStats) {
        // Stats numbers
        binding.tvFilmsCount.text = formatNumber(stats.films)
        binding.tvDiaryCount.text = formatNumber(stats.diary)
        binding.tvReviewsCount.text = formatNumber(stats.reviews)
        binding.tvWatchlistCount.text = formatNumber(stats.watchlist)
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
