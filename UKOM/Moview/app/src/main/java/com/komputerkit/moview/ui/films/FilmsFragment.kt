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
import com.komputerkit.moview.ui.common.FilterSheetDialog
import com.komputerkit.moview.ui.common.FilterSheetOptions
import com.komputerkit.moview.ui.common.FilterSheetResult
import com.komputerkit.moview.ui.common.RatingSource

class FilmsFragment : Fragment() {

    private var _binding: FragmentFilmsBinding? = null
    private val binding get() = _binding!!
    
    private val args: FilmsFragmentArgs by navArgs()
    private val viewModel: FilmsViewModel by viewModels()
    private lateinit var filmGridAdapter: FilmGridAdapter
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
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
        
        // Load films for the target user
        viewModel.loadFilms(targetUserId)
    }
    
    override fun onResume() {
        super.onResume()
        // Reload films when returning from other screens
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        viewModel.loadFilms(targetUserId)
    }
    
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
        
        binding.rvFilms.apply {
            adapter = filmGridAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
        }
    }
    
    private fun setupObservers() {
        viewModel.films.observe(viewLifecycleOwner) { films ->
            Log.d("FilmsFragment", "Observer received ${films.size} films")
            films.forEach { film ->
                Log.d("FilmsFragment", "Film to adapter: ${film.title}, isLiked=${film.isLiked}")
            }
            filmGridAdapter.submitList(films)
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
                dateChoice = viewModel.currentDateChoice()
            ),
            initialCategory = initialCategory,
            onApply = { result ->
                viewModel.setGenre(result.genre)
                viewModel.setTheme(result.theme)
                viewModel.setCountry(result.country)
                viewModel.setLanguage(result.language)

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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
