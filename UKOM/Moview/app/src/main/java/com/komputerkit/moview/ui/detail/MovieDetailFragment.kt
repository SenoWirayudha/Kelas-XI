package com.komputerkit.moview.ui.detail

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.core.view.ViewCompat
import androidx.core.view.doOnLayout
import androidx.core.content.ContextCompat
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.util.loadPoster
import com.komputerkit.moview.util.loadBackdrop
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.FragmentMovieDetailBinding
import com.komputerkit.moview.util.MovieActionsHelper

class MovieDetailFragment : Fragment() {

    private var _binding: FragmentMovieDetailBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: MovieDetailViewModel by viewModels()
    private val args: MovieDetailFragmentArgs by navArgs()
    
    private lateinit var castAdapter: CastAdapter
    private lateinit var crewAdapter: CrewAdapter
    private lateinit var movieServiceAdapter: MovieServiceAdapter
    private lateinit var watchedByAdapter: MovieDetailUserPreviewAdapter
    private lateinit var wantToWatchAdapter: MovieDetailUserPreviewAdapter
    private var releaseAdapter: MovieReleaseAdapter? = null

    private var currentMovie: com.komputerkit.moview.data.model.Movie? = null
    private var isDescriptionExpanded = false
    private var selectedTabPosition = 0  // Track selected tab

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMovieDetailBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupImmersiveHeader()
        setupHeaderScrollBehavior()
        setupRecyclerViews()
        setupClickListeners()
        setupObservers()
        
        // Load movie details
        viewModel.loadMovieDetails(args.movieId)

        // Reload when returning from artwork change
        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData("artwork_saved", false)
            ?.observe(viewLifecycleOwner) { saved ->
                if (saved) {
                    findNavController().currentBackStackEntry?.savedStateHandle?.set("artwork_saved", false)
                    viewModel.loadMovieDetails(args.movieId)
                }
            }
    }
    
    private fun setupRecyclerViews() {
        // Cast - with click handler to navigate to crew detail
        castAdapter = CastAdapter { castMember ->
            val action = MovieDetailFragmentDirections.actionMovieDetailToCrewDetail(castMember.id)
            findNavController().navigate(action)
        }
        binding.rvCast.apply {
            adapter = castAdapter
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }

        watchedByAdapter = MovieDetailUserPreviewAdapter(
            showStars = true,
            onItemClick = { item ->
                if ((item.reviewId ?: 0) > 0) {
                    val action = MovieDetailFragmentDirections
                        .actionMovieDetailToReviewDetail(item.reviewId ?: 0, false)
                    findNavController().navigate(action)
                } else {
                    val action = MovieDetailFragmentDirections.actionMovieDetailToProfile(item.userId)
                    findNavController().navigate(action)
                }
            },
            onBadgeClick = {
                val action = MovieDetailFragmentDirections
                    .actionMovieDetailToWatchedUsers(
                        args.movieId,
                        currentMovie?.title ?: "Movie",
                        "friends",
                        "watched_by"
                    )
                findNavController().navigate(action)
            }
        )

        binding.rvWatchedByPreview.apply {
            adapter = watchedByAdapter
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }

        wantToWatchAdapter = MovieDetailUserPreviewAdapter(
            showStars = false,
            onItemClick = { item ->
                val action = MovieDetailFragmentDirections.actionMovieDetailToProfile(item.userId)
                findNavController().navigate(action)
            },
            onBadgeClick = {
                val action = MovieDetailFragmentDirections
                    .actionMovieDetailToWatchedUsers(
                        args.movieId,
                        currentMovie?.title ?: "Movie",
                        "friends",
                        "want_to_watch"
                    )
                findNavController().navigate(action)
            }
        )

        binding.rvWantToWatchPreview.apply {
            adapter = wantToWatchAdapter
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }
    }
    
    private fun setupObservers() {
        viewModel.movie.observe(viewLifecycleOwner) { movie ->
            currentMovie = movie
            
            // Scroll to top when new movie data is loaded
            binding.scrollView.post {
                if (_binding != null) {
                    binding.scrollView.scrollTo(0, 0)
                }
            }
            
            binding.tvTitle.text = movie.title ?: "Unknown Title"
            binding.tvHeaderTitle.text = movie.title ?: "Unknown Title"

            val originalTitle = movie.originalTitle
            if (!originalTitle.isNullOrBlank() && originalTitle != movie.title) {
                binding.tvOriginalTitle.text = originalTitle
                binding.tvOriginalTitle.visibility = View.VISIBLE
            } else {
                binding.tvOriginalTitle.visibility = View.GONE
            }

            binding.tvYear.text = movie.releaseYear?.toString() ?: "-"
            binding.tvDuration.text = movie.duration ?: "Unknown"
            binding.tvPgRating.text = movie.pgRating ?: "Not Rated"
            binding.tvGenre.text = movie.genre ?: "Unknown Genre"
            binding.tvDirector.text = movie.director ?: "Unknown Director"
            binding.tvDescription.text = movie.description ?: "No description available."
            binding.tvWatchedCount.text = movie.watchedCount ?: "0"
            binding.tvReviewCount.text = movie.reviewCount ?: "0"
            binding.tvAverageRating.text = String.format("%.1f", movie.averageRating ?: 0.0)
            
            // Rating distribution (10 buckets 0.5-5.0, vertical chart)
            binding.ratingChart.setDistribution(movie.ratingDistribution)
            
            // Load images with optimization (caching, resizing, smooth transition)
            binding.ivPoster.loadPoster(movie.posterUrl, movie.title)
            if (movie.backdropUrl.isNullOrBlank()) {
                binding.frameBackdrop.visibility = View.GONE
                val infoParams = binding.layoutMovieInfo.layoutParams as android.widget.LinearLayout.LayoutParams
                infoParams.topMargin = 0
                binding.layoutMovieInfo.layoutParams = infoParams
                val titleParams = binding.layoutTitleInfo.layoutParams as android.widget.LinearLayout.LayoutParams
                titleParams.gravity = android.view.Gravity.TOP
                binding.layoutTitleInfo.layoutParams = titleParams
                applyEmptyBackdropHeader()
            } else {
                binding.frameBackdrop.visibility = View.VISIBLE
                val infoParams = binding.layoutMovieInfo.layoutParams as android.widget.LinearLayout.LayoutParams
                infoParams.topMargin = -resources.getDimensionPixelSize(com.komputerkit.moview.R.dimen.backdrop_overlap)
                binding.layoutMovieInfo.layoutParams = infoParams
                val titleParams = binding.layoutTitleInfo.layoutParams as android.widget.LinearLayout.LayoutParams
                titleParams.gravity = android.view.Gravity.BOTTOM
                binding.layoutTitleInfo.layoutParams = titleParams
                binding.ivBackdrop.loadBackdrop(movie.backdropUrl)
                resetHeaderForBackdrop()
            }
            
            // Show/hide trailer button based on trailer availability
            if (!movie.trailerUrl.isNullOrEmpty()) {
                binding.btnWatchTrailer.visibility = View.VISIBLE
                currentMovie = movie  // Store for trailer access
            } else {
                binding.btnWatchTrailer.visibility = View.GONE
            }
            
            // Setup long press on poster to show actions
            MovieActionsHelper.setupPosterLongClick(
                posterView = binding.ivPoster,
                movie = movie,
                lifecycleOwner = viewLifecycleOwner,
                isFromMovieDetail = true,
                onLogFilm = { m ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToLogFilm(m.id)
                    findNavController().navigate(action)
                },
                onChangePoster = { m ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToPosterBackdrop(m.id)
                    findNavController().navigate(action)
                }
            )
            
            // Cast
            castAdapter.submitList(movie.cast)
            
            // Crew
            android.util.Log.d("MovieDetail", "Crew data received: ${movie.crew.size} jobs")
            movie.crew.forEach { job ->
                android.util.Log.d("MovieDetail", "Job: ${job.job}, People: ${job.people.size}")
            }
            if (!::crewAdapter.isInitialized) {
                crewAdapter = CrewAdapter { crewPerson ->
                    // Navigate to crew detail
                    val action = MovieDetailFragmentDirections.actionMovieDetailToCrewDetail(crewPerson.id)
                    findNavController().navigate(action)
                }
            }
            // Always re-attach adapter and layout manager
            binding.rvCrew.apply {
                adapter = crewAdapter
                layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
            }
            crewAdapter.submitList(movie.crew)
            
            // Where to Watch - determine theatrical vs streaming
            updateWhereToWatch(movie)
            
            // Update Details tab with real data
            updateDetailsTab(movie)
            
            // Update Rilis tab with release dates
            updateRilisTab(movie)
            
            // Restore selected tab after data is loaded
            binding.tabLayout.post {
                if (_binding != null) {
                    binding.tabLayout.getTabAt(selectedTabPosition)?.select()
                }
            }
        }

        viewModel.watchedByPreview.observe(viewLifecycleOwner) { users ->
            watchedByAdapter.submitList(users)
            binding.layoutWatchedBySection.visibility = if (users.isEmpty()) View.GONE else View.VISIBLE
        }

        viewModel.wantToWatchPreview.observe(viewLifecycleOwner) { users ->
            wantToWatchAdapter.submitList(users)
            binding.layoutWantToWatchSection.visibility = if (users.isEmpty()) View.GONE else View.VISIBLE
        }
    }
    
    private fun updateDetailsTab(movie: com.komputerkit.moview.data.model.Movie) {
        android.util.Log.d("MovieDetail", "Production companies: ${movie.productionCompanies}")
        android.util.Log.d("MovieDetail", "Production countries: ${movie.productionCountries}")
        android.util.Log.d("MovieDetail", "Spoken languages: ${movie.spokenLanguages}")
        
        // Production Companies - show all
        val productionChipGroup = binding.chipGroupProductionHouses
        productionChipGroup.removeAllViews()
        if (movie.productionCompanies.isNotEmpty()) {
            movie.productionCompanies.forEach { company ->
                val chip = com.google.android.material.chip.Chip(requireContext())
                chip.text = company
                chip.setTextColor(resources.getColor(com.komputerkit.moview.R.color.white, null))
                chip.chipBackgroundColor = android.content.res.ColorStateList.valueOf(
                    resources.getColor(com.komputerkit.moview.R.color.dark_card, null)
                )
                chip.chipStrokeWidth = 0f
                chip.setOnClickListener {
                    navigateToFilmList("production_house", company, company)
                }
                productionChipGroup.addView(chip)
            }
            binding.layoutProductionHouse.visibility = View.VISIBLE
        } else {
            binding.layoutProductionHouse.visibility = View.GONE
        }
        
        // Countries - show all
        val countriesChipGroup = binding.chipGroupCountries
        countriesChipGroup.removeAllViews()
        if (movie.productionCountries.isNotEmpty()) {
            movie.productionCountries.forEach { country ->
                val chip = com.google.android.material.chip.Chip(requireContext())
                chip.text = country
                chip.setTextColor(resources.getColor(com.komputerkit.moview.R.color.white, null))
                chip.chipBackgroundColor = android.content.res.ColorStateList.valueOf(
                    resources.getColor(com.komputerkit.moview.R.color.dark_card, null)
                )
                chip.chipStrokeWidth = 0f
                chip.setOnClickListener {
                    navigateToFilmList("country", country, country)
                }
                countriesChipGroup.addView(chip)
            }
            binding.layoutCountry.visibility = View.VISIBLE
        } else {
            binding.layoutCountry.visibility = View.GONE
        }
        
        // Languages - show all spoken languages
        val languagesChipGroup = binding.chipGroupLanguages
        languagesChipGroup.removeAllViews()
        if (movie.spokenLanguages.isNotEmpty()) {
            movie.spokenLanguages.forEach { language ->
                val chip = com.google.android.material.chip.Chip(requireContext())
                chip.text = language
                chip.setTextColor(resources.getColor(com.komputerkit.moview.R.color.white, null))
                chip.chipBackgroundColor = android.content.res.ColorStateList.valueOf(
                    resources.getColor(com.komputerkit.moview.R.color.dark_card, null)
                )
                chip.chipStrokeWidth = 0f
                chip.setOnClickListener {
                    navigateToFilmList("language", language, language)
                }
                languagesChipGroup.addView(chip)
            }
            binding.layoutLanguage.visibility = View.VISIBLE
        } else {
            binding.layoutLanguage.visibility = View.GONE
        }
        
        // Genres - clear existing and add from movie
        val chipGroup = binding.chipGroupGenres
        chipGroup.removeAllViews()
        
        movie.genre?.split(", ")?.forEach { genre ->
            val chip = com.google.android.material.chip.Chip(requireContext())
            chip.text = genre
            chip.setTextColor(resources.getColor(com.komputerkit.moview.R.color.white, null))
            chip.chipBackgroundColor = android.content.res.ColorStateList.valueOf(
                resources.getColor(com.komputerkit.moview.R.color.dark_card, null)
            )
            chip.chipStrokeWidth = 0f
            chip.setOnClickListener {
                navigateToFilmList("genre", genre, genre)
            }
            chipGroup.addView(chip)
        }

        // Themes - show all
        val themesChipGroup = binding.chipGroupThemes
        themesChipGroup.removeAllViews()
        if (movie.themes.isNotEmpty()) {
            movie.themes.forEach { theme ->
                val chip = com.google.android.material.chip.Chip(requireContext())
                chip.text = theme
                chip.setTextColor(resources.getColor(com.komputerkit.moview.R.color.white, null))
                chip.chipBackgroundColor = android.content.res.ColorStateList.valueOf(
                    resources.getColor(com.komputerkit.moview.R.color.dark_card, null)
                )
                chip.chipStrokeWidth = 0f
                chip.setOnClickListener {
                    navigateToFilmList("theme", theme, theme)
                }
                themesChipGroup.addView(chip)
            }
            binding.layoutTheme.visibility = View.VISIBLE
        } else {
            binding.layoutTheme.visibility = View.GONE
        }
    }
    
    private fun updateWhereToWatch(movie: com.komputerkit.moview.data.model.Movie) {
        val hasTheatrical = movie.theatricalServices.isNotEmpty()
        val hasStreaming = movie.streamingServices.isNotEmpty()
        
        if (hasTheatrical) {
            // Determine if upcoming or now showing
            val now = java.util.Date()
            val hasUpcoming = movie.theatricalServices.any { service ->
                service.is_coming_soon || service.release_date?.let { dateString ->
                    try {
                        val parser = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                        val releaseDate = parser.parse(dateString)
                        releaseDate?.after(now) == true
                    } catch (e: Exception) {
                        false
                    }
                } ?: false
            }
            
            binding.tvWhereToWatchTitle.text = if (hasUpcoming) {
                "Upcoming in Theaters"
            } else {
                "Now Showing in Theaters"
            }
            
            // Initialize adapter if needed
            if (!::movieServiceAdapter.isInitialized) {
                movieServiceAdapter = MovieServiceAdapter()
            }
            // Always re-attach adapter and layout manager
            binding.rvStreaming.apply {
                adapter = movieServiceAdapter
                layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
            }
            
            movieServiceAdapter.submitTheatricalServices(movie.theatricalServices)
            binding.layoutWhereToWatch.visibility = View.VISIBLE
            
        } else if (hasStreaming) {
            binding.tvWhereToWatchTitle.text = "Where to Watch"
            
            // Initialize adapter if needed
            if (!::movieServiceAdapter.isInitialized) {
                movieServiceAdapter = MovieServiceAdapter()
            }
            // Always re-attach adapter and layout manager
            binding.rvStreaming.apply {
                adapter = movieServiceAdapter
                layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
            }
            
            movieServiceAdapter.submitStreamingServices(movie.streamingServices)
            binding.layoutWhereToWatch.visibility = View.VISIBLE
            
        } else {
            // No services available
            binding.layoutWhereToWatch.visibility = View.GONE
        }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.btnWatchTrailer.setOnClickListener {
            openTrailer()
        }
        
        // Click on year to navigate to film list filtered by year
        binding.tvYear.setOnClickListener {
            currentMovie?.let { movie ->
                val action = MovieDetailFragmentDirections.actionMovieDetailToFilmList(
                    categoryType = "year",
                    categoryValue = movie.releaseYear.toString(),
                    categoryName = movie.releaseYear.toString()
                )
                findNavController().navigate(action)
            }
        }
        
        // Click on director to navigate to person detail
        binding.tvDirector.setOnClickListener {
            currentMovie?.let { movie ->
                movie.directorId?.let { directorId ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToCrewDetail(directorId)
                    findNavController().navigate(action)
                }
            }
        }
        
        binding.btnReadMore.setOnClickListener {
            if (isDescriptionExpanded) {
                binding.tvDescription.maxLines = 3
                binding.btnReadMore.text = "Read more"
            } else {
                binding.tvDescription.maxLines = Int.MAX_VALUE
                binding.btnReadMore.text = "Show less"
            }
            isDescriptionExpanded = !isDescriptionExpanded
        }
        
        val navigateToReviews: () -> Unit = {
            viewModel.movie.value?.let { movie ->
                val action = MovieDetailFragmentDirections
                    .actionMovieDetailToReviewsList(movie.id, movie.title ?: "Movie")
                findNavController().navigate(action)
            }
        }

        val navigateToWatchedUsers: () -> Unit = {
            viewModel.movie.value?.let { movie ->
                val action = MovieDetailFragmentDirections
                    .actionMovieDetailToWatchedUsers(movie.id, movie.title ?: "Movie")
                findNavController().navigate(action)
            }
        }

        binding.btnSeeAllReviews.setOnClickListener { navigateToReviews() }
        binding.cardReviews.setOnClickListener { navigateToReviews() }
        binding.cardWatched.setOnClickListener { navigateToWatchedUsers() }
        
        binding.btnOpenActions.setOnClickListener {
            showMovieActionsBottomSheet()
        }

        binding.btnWatchedByMore.setOnClickListener {
            val action = MovieDetailFragmentDirections
                .actionMovieDetailToWatchedUsers(
                    args.movieId,
                    currentMovie?.title ?: "Movie",
                    "friends",
                    "watched_by"
                )
            findNavController().navigate(action)
        }

        binding.btnWantToWatchMore.setOnClickListener {
            val action = MovieDetailFragmentDirections
                .actionMovieDetailToWatchedUsers(
                    args.movieId,
                    currentMovie?.title ?: "Movie",
                    "friends",
                    "want_to_watch"
                )
            findNavController().navigate(action)
        }
        
        // Tap poster to show full poster dialog
        binding.ivPoster.setOnClickListener {
            currentMovie?.let { movie ->
                MovieActionsHelper.showFullPosterDialog(requireContext(), movie)
            }
        }
        
        // Tab switching
        binding.tabLayout.addOnTabSelectedListener(object : com.google.android.material.tabs.TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: com.google.android.material.tabs.TabLayout.Tab?) {
                selectedTabPosition = tab?.position ?: 0
                when (tab?.position) {
                    0 -> showCastTab()
                    1 -> showCrewTab()
                    2 -> showDetailsTab()
                    3 -> showRilisTab()
                }
            }
            override fun onTabUnselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
            override fun onTabReselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
        })
    }
    
    private fun showCastTab() {
        binding.rvCast.visibility = View.VISIBLE
        binding.rvCrew.visibility = View.GONE
        binding.tvCrewPlaceholder.visibility = View.GONE
        binding.layoutDetails.visibility = View.GONE
    }
    
    private fun showCrewTab() {
        binding.rvCast.visibility = View.GONE
        binding.layoutDetails.visibility = View.GONE
        
        // Show crew or placeholder
        currentMovie?.let { movie ->
            android.util.Log.d("MovieDetail", "showCrewTab - Crew size: ${movie.crew.size}")
            if (movie.crew.isNotEmpty()) {
                binding.rvCrew.visibility = View.VISIBLE
                binding.tvCrewPlaceholder.visibility = View.GONE
            } else {
                binding.rvCrew.visibility = View.GONE
                binding.tvCrewPlaceholder.visibility = View.VISIBLE
            }
        } ?: run {
            android.util.Log.d("MovieDetail", "showCrewTab - currentMovie is null")
            binding.rvCrew.visibility = View.GONE
            binding.tvCrewPlaceholder.visibility = View.VISIBLE
        }
    }
    
    private fun showDetailsTab() {
        binding.rvCast.visibility = View.GONE
        binding.rvCrew.visibility = View.GONE
        binding.tvCrewPlaceholder.visibility = View.GONE
        binding.layoutDetails.visibility = View.VISIBLE
    }

    private fun showRilisTab() {
        binding.rvCast.visibility = View.GONE
        binding.rvCrew.visibility = View.GONE
        binding.tvCrewPlaceholder.visibility = View.GONE
        binding.layoutDetails.visibility = View.GONE
        binding.layoutRilis.visibility = View.VISIBLE
    }
    
    private fun updateRilisTab(movie: com.komputerkit.moview.data.model.Movie) {
        val releases = movie.movieReleases
        val hasReleases = releases.isNotEmpty()

        // Hide the Rilis tab entirely when there is no release data
        binding.tabRilis.visibility = if (hasReleases) View.VISIBLE else View.GONE

        if (!hasReleases) {
            // If the Rilis tab is no longer available, fall back to the current tab
            if (selectedTabPosition == 3) {
                binding.tabLayout.getTabAt(2)?.select()
            }
            return
        }

        val isReleased = movie.releaseStatus == "released"
        binding.tvReleaseStatusBadge.apply {
            text = if (isReleased) "Rilis" else "Coming Soon"
            setBackgroundResource(
                if (isReleased) R.drawable.bg_badge_release_streaming
                else R.drawable.bg_badge_release_theatrical
            )
        }
        binding.tvReleaseStatusInfo.text = if (isReleased) {
            "Sudah ada rilis theatrical/streaming yang tanggalnya telah lewat."
        } else {
            "Belum ada rilis theatrical/streaming yang tanggalnya lewat."
        }

        if (releaseAdapter == null) {
            releaseAdapter = MovieReleaseAdapter(releases)
            binding.rvMovieReleases.adapter = releaseAdapter
            binding.rvMovieReleases.layoutManager = LinearLayoutManager(requireContext())
        } else {
            // Recreate adapter so items reflect the freshly loaded list
            releaseAdapter = MovieReleaseAdapter(releases)
            binding.rvMovieReleases.adapter = releaseAdapter
        }
    }
    
    private fun navigateToFilmList(categoryType: String, categoryValue: String, categoryName: String) {
        val action = MovieDetailFragmentDirections
            .actionMovieDetailToFilmList(categoryType, categoryValue, categoryName)
        findNavController().navigate(action)
    }
    
    private fun showMovieActionsBottomSheet() {
        viewModel.movie.value?.let { movie ->
            Log.d("MovieDetailFragment", "Opening bottom sheet for movie: id=${movie.id}, title=${movie.title}")
            MovieActionsHelper.showMovieActionsBottomSheet(
                context = requireContext(),
                movie = movie,
                lifecycleOwner = viewLifecycleOwner,
                isFromMovieDetail = true, // Hide "Go to film" since we're already here
                onGoToFilm = null, // Not needed since we hide it
                onLogFilm = { m ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToLogFilm(m.id)
                    findNavController().navigate(action)
                },
                onChangePoster = { m ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToPosterBackdrop(m.id)
                    findNavController().navigate(action)
                },
                onRatingSaved = {
                    // Reload movie data after rating is saved
                    Log.d("MovieDetailFragment", "Rating saved, reloading movie data for id=${movie.id}")
                    viewModel.loadMovieDetails(movie.id)
                },
                onWatchedTap = { reviewId, isLog ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToReviewDetail(
                        reviewId = reviewId,
                        isLog = isLog
                    )
                    findNavController().navigate(action)
                }
            )
        }
    }
    
    private fun openTrailer() {
        val trailerUrl = currentMovie?.trailerUrl
        
        if (trailerUrl.isNullOrEmpty()) {
            Toast.makeText(requireContext(), "Trailer not available", Toast.LENGTH_SHORT).show()
            return
        }
        
        try {
            // Check if it's a YouTube URL
            val youtubeVideoId = extractYouTubeVideoId(trailerUrl)
            
            if (youtubeVideoId != null) {
                // Try to open in YouTube app first
                val appIntent = android.content.Intent(
                    android.content.Intent.ACTION_VIEW,
                    android.net.Uri.parse("vnd.youtube:$youtubeVideoId")
                )
                
                try {
                    startActivity(appIntent)
                } catch (e: android.content.ActivityNotFoundException) {
                    // If YouTube app not installed, open in browser
                    val webIntent = android.content.Intent(
                        android.content.Intent.ACTION_VIEW,
                        android.net.Uri.parse("https://www.youtube.com/watch?v=$youtubeVideoId")
                    )
                    startActivity(webIntent)
                }
            } else {
                // For non-YouTube URLs, open in browser
                val intent = android.content.Intent(
                    android.content.Intent.ACTION_VIEW,
                    android.net.Uri.parse(trailerUrl)
                )
                startActivity(intent)
            }
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Cannot open trailer: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun extractYouTubeVideoId(url: String): String? {
        // Handle different YouTube URL formats:
        // https://www.youtube.com/watch?v=VIDEO_ID
        // https://youtu.be/VIDEO_ID
        // https://www.youtube.com/embed/VIDEO_ID
        
        val patterns = listOf(
            "(?<=watch\\?v=)[^&]+".toRegex(),
            "(?<=youtu.be/)[^?]+".toRegex(),
            "(?<=embed/)[^?]+".toRegex()
        )
        
        patterns.forEach { pattern ->
            pattern.find(url)?.value?.let { return it }
        }
        
        return null
    }

    override fun onDestroyView() {
        restoreStatusBar()
        super.onDestroyView()
        _binding = null
    }

    private var originalStatusBarColor = 0

    private fun setupImmersiveHeader() {
        val window = requireActivity().window
        originalStatusBarColor = window.statusBarColor
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT

        // Push the back button below the status bar so it isn't overlapped by clock/icons
        ViewCompat.setOnApplyWindowInsetsListener(binding.toolbar) { v, insets ->
            val top = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top
            v.setPadding(v.paddingLeft, top, v.paddingRight, v.paddingBottom)
            insets
        }
        binding.toolbar.requestApplyInsets()
    }

    private var headerSolid = false
    private var headerTitleVisible = false
    private var bgAnimator: android.animation.ValueAnimator? = null

    private fun setupHeaderScrollBehavior() {
        val backdropHeight = resources.getDimensionPixelSize(R.dimen.backdrop_height)
        binding.scrollView.setOnScrollChangeListener { _, _, scrollY, _, _ ->
            val hasBackdrop = binding.frameBackdrop.visibility == View.VISIBLE
            if (hasBackdrop) {
                setHeaderSolid(scrollY >= backdropHeight)
                setHeaderTitleVisible(scrollY >= backdropHeight)
            } else {
                // Empty backdrop: header is already a solid block (classic toolbar),
                // only the title reacts to scrolling.
                setHeaderTitleVisible(scrollY > 0)
            }
        }
    }

    // Special strategy when the backdrop is empty: the header renders as a classic
    // fixed toolbar (solid block + back) and the scroll content is pushed down below
    // the header block, so it never collides with the layout.
    private fun applyEmptyBackdropHeader() {
        setHeaderSolid(true)
        setHeaderTitleVisible(false)
        binding.toolbar.doOnLayout {
            if (_binding == null) return@doOnLayout
            binding.scrollView.setPadding(
                binding.scrollView.paddingLeft,
                it.height,
                binding.scrollView.paddingRight,
                binding.scrollView.paddingBottom
            )
        }
    }

    // Restore the standard immersive header when a backdrop is present.
    private fun resetHeaderForBackdrop() {
        binding.scrollView.setPadding(
            binding.scrollView.paddingLeft,
            0,
            binding.scrollView.paddingRight,
            binding.scrollView.paddingBottom
        )
        setHeaderSolid(false)
        setHeaderTitleVisible(false)
    }

    private fun setHeaderSolid(solid: Boolean) {
        binding.toolbar.post {
            if (_binding == null) return@post
            if (solid == headerSolid) return@post
            headerSolid = solid

            val solidColor = ContextCompat.getColor(requireContext(), R.color.dark_background)
            val transparent = Color.TRANSPARENT
            val start = if (solid) transparent else solidColor
            val end = if (solid) solidColor else transparent

            bgAnimator?.cancel()
            bgAnimator = android.animation.ValueAnimator.ofInt(start, end).apply {
                duration = 180
                setEvaluator(android.animation.ArgbEvaluator())
                addUpdateListener {
                    binding.toolbar.setBackgroundColor(it.animatedValue as Int)
                }
                start()
            }

            // Drop the scrim circle once the header is solid (readability provided by the block)
            binding.btnBackContainer.background = if (solid) {
                null
            } else {
                ContextCompat.getDrawable(requireContext(), R.drawable.bg_back_button)
            }
        }
    }

    private fun setHeaderTitleVisible(visible: Boolean) {
        binding.toolbar.post {
            if (_binding == null) return@post
            if (visible == headerTitleVisible) return@post
            headerTitleVisible = visible

            binding.tvHeaderTitle.apply {
                alpha = if (visible) 1f else 0f
                if (visible) visibility = View.VISIBLE
            }
            if (!visible) binding.tvHeaderTitle.postDelayed({
                if (!headerTitleVisible && _binding != null) binding.tvHeaderTitle.visibility = View.GONE
            }, 200)
        }
    }

    private fun restoreStatusBar() {
        val window = requireActivity().window
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = originalStatusBarColor
    }
}
