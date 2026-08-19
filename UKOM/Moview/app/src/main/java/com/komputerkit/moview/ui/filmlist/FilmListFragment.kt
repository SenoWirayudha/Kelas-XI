package com.komputerkit.moview.ui.filmlist

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.FragmentFilmListBinding
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.ui.common.FilterSheetDialog
import com.komputerkit.moview.ui.common.FilterSheetOptions
import com.komputerkit.moview.ui.common.FilterSheetResult
import com.komputerkit.moview.ui.common.MovieFilterState
import com.komputerkit.moview.ui.common.MovieFilterUtils
import com.komputerkit.moview.ui.common.MovieSortMode
import com.komputerkit.moview.ui.common.RatingSource
import com.komputerkit.moview.util.applyCustomMedia
import com.komputerkit.moview.util.ScrollStateHelper
import kotlinx.coroutines.launch

class FilmListFragment : Fragment() {

    private var _binding: FragmentFilmListBinding? = null
    private val binding get() = _binding!!
    private val args: FilmListFragmentArgs by navArgs()

    private lateinit var adapter: FilmGridAdapter
    private val repository = MovieRepository()
    private var savedScrollState: Pair<Int, Int>? = null

    private var allFilms: List<Movie> = emptyList()
    private var filterState = MovieFilterState(sortMode = MovieSortMode.POPULARITY)

    private var genreOptions: List<String> = emptyList()
    private var themeOptions: List<String> = emptyList()
    private var countryOptions: List<String> = emptyList()
    private var languageOptions: List<String> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFilmListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupToolbar()
        setupFilterChips()
        setupRecyclerView()
        loadFilms()
    }

    override fun onResume() {
        super.onResume()
        loadFilms()
    }

    private fun setupToolbar() {
        binding.tvTitle.text = args.categoryName
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }

    private fun setupRecyclerView() {
        adapter = FilmGridAdapter(
            onMovieClick = { movie ->
                val action = FilmListFragmentDirections.actionFilmListToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            onLogFilm = { movie ->
                val action = FilmListFragmentDirections.actionFilmListToLogFilm(movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = FilmListFragmentDirections.actionFilmListToPosterBackdrop(movie.id, false)
                findNavController().navigate(action)
            }
        )
        binding.rvFilms.apply {
            layoutManager = GridLayoutManager(requireContext(), 4)
            adapter = this@FilmListFragment.adapter
        }
    }

    private fun setupFilterChips() {
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
                years = availableYears()
            ),
            initial = FilterSheetResult(
                genre = filterState.selectedGenre,
                theme = filterState.selectedTheme,
                language = filterState.selectedLanguage,
                country = filterState.selectedCountry,
                releaseYearChoice = currentReleaseYearChoice(),
                ratingChoice = currentRatingChoice(),
                year = filterState.selectedYear
            ),
            initialCategory = initialCategory,
            onApply = { result ->
                setGenre(result.genre)
                setTheme(result.theme)
                setCountry(result.country)
                setLanguage(result.language)

                when (result.releaseYearChoice) {
                    "Newest First" -> sortByReleaseYear(descending = true)
                    "Earliest First" -> sortByReleaseYear(descending = false)
                    null -> Unit
                }

                when (result.ratingChoice) {
                    "Highest Rated: Average" -> sortByHighestRated(RatingSource.AVERAGE)
                    "Highest Rated: Your" -> sortByHighestRated(RatingSource.YOUR)
                    "Lowest Rated: Average" -> sortByLowestRated(RatingSource.AVERAGE)
                    "Lowest Rated: Your" -> sortByLowestRated(RatingSource.YOUR)
                    null -> Unit
                }

                result.year?.let {
                    setYear(it)
                } ?: run {
                    setYear(null)
                }
            }
        ).show()
    }

    private fun availableYears(): List<String> =
        allFilms.mapNotNull { it.releaseYear }.distinct().sortedDescending().map { it.toString() }

    private fun currentReleaseYearChoice(): String? = when {
        filterState.sortMode != MovieSortMode.RELEASE_YEAR -> null
        filterState.releaseYearDescending -> "Newest First"
        else -> "Earliest First"
    }

    private fun currentRatingChoice(): String? {
        if (filterState.sortMode != MovieSortMode.RATING) return null
        return if (filterState.ratingDescending) {
            "Highest Rated: ${if (filterState.ratingSource == RatingSource.AVERAGE) "Average" else "Your"}"
        } else {
            "Lowest Rated: ${if (filterState.ratingSource == RatingSource.AVERAGE) "Average" else "Your"}"
        }
    }

    private fun sortByReleaseYear(descending: Boolean) {
        filterState = filterState.copy(
            sortMode = MovieSortMode.RELEASE_YEAR,
            releaseYearDescending = descending
        )
        applyCurrentFilters()
    }

    private fun sortByHighestRated(source: RatingSource) {
        filterState = filterState.copy(
            sortMode = MovieSortMode.RATING,
            ratingSource = source,
            ratingDescending = true
        )
        applyCurrentFilters()
    }

    private fun sortByLowestRated(source: RatingSource) {
        filterState = filterState.copy(
            sortMode = MovieSortMode.RATING,
            ratingSource = source,
            ratingDescending = false
        )
        applyCurrentFilters()
    }

    private fun setYear(year: Int?) {
        filterState = filterState.copy(selectedYear = year)
        applyCurrentFilters()
    }

    private fun setGenre(genre: String?) {
        filterState = filterState.copy(selectedGenre = genre)
        applyCurrentFilters()
    }

    private fun setCountry(country: String?) {
        filterState = filterState.copy(selectedCountry = country)
        applyCurrentFilters()
    }

    private fun setLanguage(language: String?) {
        filterState = filterState.copy(selectedLanguage = language)
        applyCurrentFilters()
    }

    private fun setTheme(theme: String?) {
        filterState = filterState.copy(selectedTheme = theme)
        applyCurrentFilters()
    }

    private fun loadFilms() {
        binding.progressBar.visibility = View.VISIBLE
        binding.tvEmpty.visibility = View.GONE

        val userId = requireContext()
            .getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
            .getInt("userId", 0)

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val rawFilms = repository.getFilmsByCategory(args.categoryType, args.categoryValue)

                val films = if (userId > 0 && rawFilms.isNotEmpty()) {
                    val customMedia = repository.batchCustomMedia(userId, rawFilms.map { it.id }, "films")
                    rawFilms.applyCustomMedia(customMedia)
                } else {
                    rawFilms
                }

                allFilms = films
                if (genreOptions.isEmpty()) {
                    val options = repository.getFilterOptions()
                    genreOptions = options.genres
                    themeOptions = options.themes
                    countryOptions = options.countries
                    languageOptions = options.languages
                }
                applyCurrentFilters()
            } catch (e: Exception) {
                binding.progressBar.visibility = View.GONE
                binding.tvEmpty.visibility = View.VISIBLE
                binding.tvEmpty.text = "Failed to load films. Please try again."
                e.printStackTrace()
            }
        }
    }

    private fun applyCurrentFilters() {
        val filtered = MovieFilterUtils.applyFilters(allFilms, filterState)
        binding.progressBar.visibility = View.GONE
        if (filtered.isEmpty()) {
            binding.tvEmpty.visibility = View.VISIBLE
            binding.tvEmpty.text = "No films found for ${args.categoryName}"
        } else {
            binding.tvEmpty.visibility = View.GONE
            adapter.submitList(filtered)
            ScrollStateHelper.restore(binding.rvFilms, savedScrollState)
            savedScrollState = null
        }
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