package com.komputerkit.moview.ui.filmography

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.FragmentFilmographyBinding
import com.komputerkit.moview.ui.common.DurationFilter
import com.komputerkit.moview.ui.common.FilterSheetDialog
import com.komputerkit.moview.ui.common.FilterSheetOptions
import com.komputerkit.moview.ui.common.FilterSheetResult
import com.komputerkit.moview.ui.common.LoadingFooterAdapter
import com.komputerkit.moview.ui.common.PagedList
import com.komputerkit.moview.ui.common.RatingSource
import com.komputerkit.moview.util.ScrollStateHelper

class FilmographyFragment : Fragment() {

    private var _binding: FragmentFilmographyBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmographyViewModel by viewModels()
    private val args: FilmographyFragmentArgs by navArgs()

    private lateinit var filmographyAdapter: FilmographyAdapter
    private var listFooter: LoadingFooterAdapter? = null
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
        _binding = FragmentFilmographyBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupToolbar()
        setupFilters()
        setupRecyclerView()
        setupObservers()
        loadFilmography()
    }

    override fun onResume() {
        super.onResume()
        loadFilmography()
    }

    private fun loadFilmography() {
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val userId = prefs.getInt("userId", 0)
        viewModel.loadFilmography(args.filterType, args.filterValue, userId)
    }

    private fun setupToolbar() {
        binding.tvTitle.text = args.filterValue
        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
    }

    private fun setupRecyclerView() {
        filmographyAdapter = FilmographyAdapter(
            onMovieClick = { movie ->
                val action = FilmographyFragmentDirections
                    .actionFilmographyToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            onLogFilm = { movie ->
                val action = FilmographyFragmentDirections.actionFilmographyToLogFilm(movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = FilmographyFragmentDirections.actionFilmographyToPosterBackdrop(movie.id, false)
                findNavController().navigate(action)
            }
        )
        binding.rvFilmography.layoutManager = GridLayoutManager(requireContext(), 4)
        listFooter = PagedList.setup(
            binding.rvFilmography,
            filmographyAdapter,
            prefetchThreshold = 8
        ) {
            val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
            viewModel.loadMore(args.filterType, args.filterValue, prefs.getInt("userId", 0))
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
            filmographyAdapter.submitList(films)
            binding.tvEmpty.visibility = if (films.isEmpty()) View.VISIBLE else View.GONE
            ScrollStateHelper.restore(binding.rvFilmography, savedScrollState)
            savedScrollState = null
        }

        viewModel.genres.observe(viewLifecycleOwner) { genreOptions = it }
        viewModel.countries.observe(viewLifecycleOwner) { countryOptions = it }
        viewModel.languages.observe(viewLifecycleOwner) { languageOptions = it }
        viewModel.themes.observe(viewLifecycleOwner) { themeOptions = it }
    }

    private fun setupFilters() {
        binding.btnFilter.setOnClickListener {
            showFilterSheet(FilterSheetDialog.Category.GENRE)
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
                }
            ),
            initial = FilterSheetResult(
                genre = viewModel.currentGenre(),
                theme = viewModel.currentTheme(),
                language = viewModel.currentLanguage(),
                country = viewModel.currentCountry(),
                productionHouse = viewModel.currentProductionHouse(),
                releaseYearChoice = viewModel.currentReleaseYearChoice(),
                ratingChoice = viewModel.currentRatingChoice(),
                year = viewModel.currentYear(),
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
        savedScrollState = ScrollStateHelper.save(binding.rvFilmography)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
