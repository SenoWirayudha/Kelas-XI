package com.komputerkit.moview.ui.likes

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.FragmentLikesBinding
import com.komputerkit.moview.ui.common.FilterSheetDialog
import com.komputerkit.moview.ui.common.FilterSheetOptions
import com.komputerkit.moview.ui.common.FilterSheetResult
import com.komputerkit.moview.ui.films.FilmGridAdapter
import com.komputerkit.moview.ui.common.RatingSource
import com.komputerkit.moview.util.ScrollStateHelper

class LikesFragment : Fragment() {

    private var _binding: FragmentLikesBinding? = null
    private val binding get() = _binding!!
    private val args: LikesFragmentArgs by navArgs()
    
    private val viewModel: LikesViewModel by viewModels()
    private lateinit var filmGridAdapter: FilmGridAdapter
    private var savedScrollState: Pair<Int, Int>? = null
    private var genreOptions: List<String> = emptyList()
    private var countryOptions: List<String> = emptyList()
    private var languageOptions: List<String> = emptyList()
    private var themeOptions: List<String> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLikesBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        viewModel.loadLikes(targetUserId)
        
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
    }
    
    override fun onResume() {
        super.onResume()
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        viewModel.loadLikes(targetUserId)
    }
    
    private fun setupRecyclerView() {
        filmGridAdapter = FilmGridAdapter(
            onMovieClick = { movie ->
                // If has review, go to review detail, otherwise go to movie detail
                if (movie.hasReview && movie.reviewId > 0) {
                    val action = LikesFragmentDirections.actionLikesToReviewDetail(movie.reviewId)
                    findNavController().navigate(action)
                } else {
                    val action = LikesFragmentDirections.actionLikesToMovieDetail(movie.id)
                    findNavController().navigate(action)
                }
            },
            onLongPressGoToFilm = { movie ->
                val action = LikesFragmentDirections.actionLikesToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            onReviewClick = { movie ->
                val action = LikesFragmentDirections.actionLikesToReviewDetail(movie.reviewId)
                findNavController().navigate(action)
            },
            onLogFilm = { movie ->
                val action = LikesFragmentDirections.actionLikesToLogFilm(movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = LikesFragmentDirections.actionLikesToPosterBackdrop(movie.id, false)
                findNavController().navigate(action)
            }
        )
        
        binding.rvLikes.apply {
            adapter = filmGridAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
        }
    }
    
    private fun setupObservers() {
        viewModel.likes.observe(viewLifecycleOwner) { films ->
            filmGridAdapter.submitList(films)
            binding.emptyState.isVisible = films.isEmpty() && viewModel.isLoading.value != true
            ScrollStateHelper.restore(binding.rvLikes, savedScrollState)
            savedScrollState = null
        }
        
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.isVisible = isLoading
            binding.rvLikes.isVisible = !isLoading
        }

        viewModel.genres.observe(viewLifecycleOwner) { genreOptions = it }
        viewModel.countries.observe(viewLifecycleOwner) { countryOptions = it }
        viewModel.languages.observe(viewLifecycleOwner) { languageOptions = it }
        viewModel.themes.observe(viewLifecycleOwner) { themeOptions = it }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }

        binding.btnFilter.setOnClickListener {
            showFilterSheet(FilterSheetDialog.Category.DATE)
        }
    }

    private fun showFilterSheet(initialCategory: FilterSheetDialog.Category) {
        FilterSheetDialog(
            context = requireContext(),
            options = FilterSheetOptions(
                genres = genreOptions,
                themes = themeOptions,
                languages = languageOptions,
                countries = countryOptions,
                years = viewModel.availableYears(),
                dateOptions = listOf("Date Liked")
            ),
            initial = FilterSheetResult(
                genre = viewModel.currentGenre(),
                theme = viewModel.currentTheme(),
                language = viewModel.currentLanguage(),
                country = viewModel.currentCountry(),
                releaseYearChoice = viewModel.currentReleaseYearChoice(),
                ratingChoice = viewModel.currentRatingChoice(),
                year = viewModel.currentYear(),
                dateChoice = viewModel.currentDateChoice()
            ),
            initialCategory = initialCategory,
            onApply = { result ->
                viewModel.setGenre(result.genre)
                viewModel.setTheme(result.theme)
                viewModel.setCountry(result.country)
                viewModel.setLanguage(result.language)

                when (result.dateChoice) {
                    "Date Liked" -> viewModel.sortByDateLiked()
                    null -> Unit
                }

                when (result.releaseYearChoice) {
                    "Newest First" -> viewModel.sortByReleaseYear(descending = true)
                    "Earliest First" -> viewModel.sortByReleaseYear(descending = false)
                    null -> Unit
                }

                when (result.ratingChoice) {
                    "Highest Rated: Average" -> viewModel.sortByHighestRated(RatingSource.AVERAGE)
                    "Highest Rated: Your" -> viewModel.sortByHighestRated(RatingSource.YOUR)
                    "Lowest Rated: Average" -> viewModel.sortByLowestRated(RatingSource.AVERAGE)
                    "Lowest Rated: Your" -> viewModel.sortByLowestRated(RatingSource.YOUR)
                    null -> Unit
                }

                result.year?.let {
                    viewModel.setYear(it)
                } ?: run {
                    viewModel.setYear(null)
                }
            }
        ).show()
    }

    override fun onStop() {
        super.onStop()
        savedScrollState = ScrollStateHelper.save(binding.rvLikes)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
