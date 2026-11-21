package com.komputerkit.moview.ui.films

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.FragmentFilmsBinding
import com.komputerkit.moview.ui.common.DurationFilter
import com.komputerkit.moview.ui.common.FilterSheetDialog
import com.komputerkit.moview.ui.common.FilterSheetOptions
import com.komputerkit.moview.ui.common.FilterSheetResult
import com.komputerkit.moview.ui.common.LoadingFooterAdapter
import com.komputerkit.moview.ui.common.PagedList
import com.komputerkit.moview.ui.common.RatingSource
import com.komputerkit.moview.util.ScrollStateHelper

class FilmsFragment : Fragment() {

    private var _binding: FragmentFilmsBinding? = null
    private val binding get() = _binding!!
    
    private val args: FilmsFragmentArgs by navArgs()
    private val viewModel: FilmsViewModel by viewModels()
    private lateinit var filmGridAdapter: FilmGridAdapter
    private var listFooter: LoadingFooterAdapter? = null
    private var targetUserId = 0
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
        _binding = FragmentFilmsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
        
        // Load films for the target user
        viewModel.loadFilms(targetUserId)
    }
    
    // No reload on resume: the ViewModel keeps the loaded pages, so coming back
    // from a film detail must not refetch page 1 (which reset the list + scroll).
    
    private fun setupRecyclerView() {
        filmGridAdapter = FilmGridAdapter(
            onMovieClick = { movie ->
                // Poster click - always navigate to Film Detail
                val action = FilmsFragmentDirections.actionFilmsToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            onReviewClick = { movie ->
                // Review icon click - navigate to Review Detail
                val action = FilmsFragmentDirections.actionFilmsToReviewDetail(movie.reviewId)
                findNavController().navigate(action)
            },
            onLogFilm = { movie ->
                val action = FilmsFragmentDirections.actionFilmsToLogFilm(movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = FilmsFragmentDirections.actionFilmsToPosterBackdrop(movie.id, false)
                findNavController().navigate(action)
            }
        )
        
        binding.rvFilms.layoutManager = GridLayoutManager(requireContext(), 4)
        listFooter = PagedList.setup(
            binding.rvFilms,
            filmGridAdapter,
            prefetchThreshold = 8
        ) {
            viewModel.loadMore(targetUserId)
        }
    }
    
    private fun setupObservers() {
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }
        viewModel.isLoadingMore.observe(viewLifecycleOwner) { loading ->
            listFooter?.setVisible(loading)
        }
        viewModel.films.observe(viewLifecycleOwner) { films ->
            Log.d("FilmsFragment", "Observer received ${films.size} films")
            films.forEach { film ->
                Log.d("FilmsFragment", "Film to adapter: ${film.title}, isLiked=${film.isLiked}")
            }
            filmGridAdapter.submitList(films)
            binding.tvEmpty.visibility = if (films.isEmpty()) View.VISIBLE else View.GONE
            ScrollStateHelper.restore(binding.rvFilms, savedScrollState)
            savedScrollState = null
            // Large-DPI screens: the first page may not fill the viewport, so the
            // scroll listener never fires. Pull the next page until it does.
            PagedList.autoLoadIfNotFilled(binding.rvFilms) { viewModel.loadMore(targetUserId) }
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
                productionHouses = viewModel.availableProductionHouses(),
                years = viewModel.availableYears(),
                // Hide an option when this page's payload has no data for it.
                sortOptions = if (viewModel.supportsPopularitySort()) {
                    listOf(FilterSheetDialog.SORT_POPULARITY_ALL_TIME)
                } else {
                    emptyList()
                },
                durationOptions = if (viewModel.supportsDurationFilter()) {
                    FilterSheetDialog.DURATION_OPTIONS
                } else {
                    emptyList()
                },
                dateOptions = listOf("Date Watched")
            ),
            initial = FilterSheetResult(
                genre = viewModel.currentGenre(),
                theme = viewModel.currentTheme(),
                language = viewModel.currentLanguage(),
                country = viewModel.currentCountry(),
                releaseYearChoice = viewModel.currentReleaseYearChoice(),
                ratingChoice = viewModel.currentRatingChoice(),
                year = viewModel.currentYear(),
                dateChoice = viewModel.currentDateChoice(),
                sortChoice = viewModel.currentSortChoice(),
                durationChoice = viewModel.currentDurationChoice()
            ),
            initialCategory = initialCategory,
            enabledCategories = setOf(
                FilterSheetDialog.Category.GENRE,
                FilterSheetDialog.Category.THEME,
                FilterSheetDialog.Category.LANGUAGE,
                FilterSheetDialog.Category.COUNTRY,
                FilterSheetDialog.Category.PRODUCTION_HOUSE,
                FilterSheetDialog.Category.RELEASE_YEAR,
                FilterSheetDialog.Category.RATING,
                FilterSheetDialog.Category.YEAR,
                FilterSheetDialog.Category.DATE,
                FilterSheetDialog.Category.SORT,
                FilterSheetDialog.Category.DURATION
            ),
            onApply = { result ->
                viewModel.setGenre(result.genre)
                viewModel.setTheme(result.theme)
                viewModel.setCountry(result.country)
                viewModel.setLanguage(result.language)
                viewModel.setProductionHouse(result.productionHouse)
                viewModel.setDurationFilter(
                    when (result.durationChoice) {
                        FilterSheetDialog.DURATION_FEATURE -> DurationFilter.FEATURE_LENGTH
                        FilterSheetDialog.DURATION_SHORT -> DurationFilter.SHORT_FILM
                        else -> null
                    }
                )

                when (result.sortChoice) {
                    FilterSheetDialog.SORT_POPULARITY_ALL_TIME -> viewModel.sortByPopularity()
                    null -> Unit
                }

                when (result.dateChoice) {
                    "Date Watched" -> viewModel.sortByDateWatched()
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
        savedScrollState = ScrollStateHelper.save(binding.rvFilms)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
