package com.komputerkit.moview.ui.detail

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.BottomSheetMovieActionsBinding
import com.komputerkit.moview.databinding.FragmentMovieDetailBinding
import com.komputerkit.moview.util.MovieActionsHelper

class MovieDetailFragment : Fragment() {

    private var _binding: FragmentMovieDetailBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: MovieDetailViewModel by viewModels()
    private val args: MovieDetailFragmentArgs by navArgs()
    
    private lateinit var castAdapter: CastAdapter
    private lateinit var similarMovieAdapter: SimilarMovieAdapter
    private lateinit var streamingServiceAdapter: StreamingServiceAdapter
    
    private var isDescriptionExpanded = false
    private var currentRating = 0

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
        
        setupRecyclerViews()
        setupClickListeners()
        setupObservers()
        
        // Load movie details
        viewModel.loadMovieDetails(args.movieId)
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
        
        // Similar Movies
        val navigateToMovie: (Movie) -> Unit = { movie ->
            val action = MovieDetailFragmentDirections.actionMovieDetailSelf(movie.id)
            findNavController().navigate(action)
        }
        similarMovieAdapter = SimilarMovieAdapter(
            onMovieClick = navigateToMovie,
            onLongPressGoToFilm = navigateToMovie
        )
        binding.rvSimilarFilms.apply {
            adapter = similarMovieAdapter
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }
    }
    
    private fun setupObservers() {
        viewModel.movie.observe(viewLifecycleOwner) { movie ->
            binding.tvTitle.text = movie.title
            binding.tvYear.text = movie.releaseYear.toString()
            binding.tvDuration.text = movie.duration
            binding.tvPgRating.text = movie.pgRating
            binding.tvGenre.text = movie.genre
            binding.tvDirector.text = movie.director
            binding.tvDescription.text = movie.description
            binding.tvWatchedCount.text = movie.watchedCount
            binding.tvReviewCount.text = movie.reviewCount
            binding.tvAverageRating.text = String.format("%.1f", movie.averageRating)
            
            // Rating distribution
            binding.progress5Star.progress = movie.rating5
            binding.progress4Star.progress = movie.rating4
            binding.progress3Star.progress = movie.rating3
            binding.progress2Star.progress = movie.rating2
            binding.progress1Star.progress = movie.rating1
            
            // Load images
            Glide.with(this)
                .load(movie.posterUrl)
                .into(binding.ivPoster)
                
            Glide.with(this)
                .load(movie.backdropUrl)
                .into(binding.ivBackdrop)
            
            // Setup long press on poster to show actions
            MovieActionsHelper.setupPosterLongClick(
                posterView = binding.ivPoster,
                movie = movie,
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
            
            // Similar movies
            similarMovieAdapter.submitList(movie.similarMovies)
        }
        
        viewModel.streamingServices.observe(viewLifecycleOwner) { services ->
            streamingServiceAdapter = StreamingServiceAdapter(services)
            binding.rvStreaming.apply {
                adapter = streamingServiceAdapter
                layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.btnShare.setOnClickListener {
            Toast.makeText(requireContext(), "Share", Toast.LENGTH_SHORT).show()
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
        
        binding.btnSeeAllReviews.setOnClickListener {
            viewModel.movie.value?.let { movie ->
                val action = MovieDetailFragmentDirections
                    .actionMovieDetailToReviewsList(movie.id, movie.title)
                findNavController().navigate(action)
            }
        }
        
        binding.btnOpenActions.setOnClickListener {
            showMovieActionsBottomSheet()
        }
        
        binding.btnViewAll.setOnClickListener {
            Toast.makeText(requireContext(), "View all similar films", Toast.LENGTH_SHORT).show()
        }
        
        // Tab switching
        binding.tabLayout.addOnTabSelectedListener(object : com.google.android.material.tabs.TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: com.google.android.material.tabs.TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> showCastTab()
                    1 -> showCrewTab()
                    2 -> showDetailsTab()
                }
            }
            override fun onTabUnselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
            override fun onTabReselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
        })
        
        // Detail tab click handlers
        binding.chipProductionHouse.setOnClickListener {
            val action = MovieDetailFragmentDirections
                .actionMovieDetailToFilmography("PRODUCTION_HOUSE", "Warner Bros. Pictures")
            findNavController().navigate(action)
        }
        
        binding.chipCountry.setOnClickListener {
            val action = MovieDetailFragmentDirections
                .actionMovieDetailToFilmography("COUNTRY", "United States")
            findNavController().navigate(action)
        }
        
        binding.chipGenre1.setOnClickListener {
            navigateToGenreFilmography("Science Fiction")
        }
        
        binding.chipGenre2.setOnClickListener {
            navigateToGenreFilmography("Adventure")
        }
        
        binding.chipGenre3.setOnClickListener {
            navigateToGenreFilmography("Drama")
        }
    }
    
    private fun showCastTab() {
        binding.rvCast.visibility = View.VISIBLE
        binding.tvCrewPlaceholder.visibility = View.GONE
        binding.layoutDetails.visibility = View.GONE
    }
    
    private fun showCrewTab() {
        binding.rvCast.visibility = View.GONE
        binding.tvCrewPlaceholder.visibility = View.VISIBLE
        binding.layoutDetails.visibility = View.GONE
    }
    
    private fun showDetailsTab() {
        binding.rvCast.visibility = View.GONE
        binding.tvCrewPlaceholder.visibility = View.GONE
        binding.layoutDetails.visibility = View.VISIBLE
    }
    
    private fun navigateToGenreFilmography(genreName: String) {
        val action = MovieDetailFragmentDirections
            .actionMovieDetailToFilmography("GENRE", genreName)
        findNavController().navigate(action)
    }
    
    private fun showMovieActionsBottomSheet() {
        viewModel.movie.value?.let { movie ->
            MovieActionsHelper.showMovieActionsBottomSheet(
                context = requireContext(),
                movie = movie,
                isFromMovieDetail = true, // Hide "Go to film" since we're already here
                onGoToFilm = null, // Not needed since we hide it
                onLogFilm = { m ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToLogFilm(m.id)
                    findNavController().navigate(action)
                },
                onChangePoster = { m ->
                    val action = MovieDetailFragmentDirections.actionMovieDetailToPosterBackdrop(m.id)
                    findNavController().navigate(action)
                }
            )
        }
    }
    
    private fun setupStarRating(bottomSheetBinding: BottomSheetMovieActionsBinding) {
        val stars = listOf(
            bottomSheetBinding.star1,
            bottomSheetBinding.star2,
            bottomSheetBinding.star3,
            bottomSheetBinding.star4,
            bottomSheetBinding.star5
        )
        
        stars.forEachIndexed { index, star ->
            star.setOnClickListener {
                currentRating = index + 1
                updateStars(stars, currentRating)
                Toast.makeText(requireContext(), "Rated: $currentRating stars", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun updateStars(stars: List<ImageView>, rating: Int) {
        stars.forEachIndexed { index, star ->
            if (index < rating) {
                star.setImageResource(R.drawable.ic_star_filled)
            } else {
                star.setImageResource(R.drawable.ic_star_outline)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
