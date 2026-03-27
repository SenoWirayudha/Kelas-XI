package com.komputerkit.moview.ui.films

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.PopupMenu
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.chip.Chip
import com.komputerkit.moview.databinding.FragmentFilmsBinding
import com.komputerkit.moview.ui.common.MovieFilterUtils
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
    }
    
    private fun setupClickListeners() {
        resetFilterChipLabels()

        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.chipDateWatched.setOnClickListener {
            markSelectedChip(binding.chipDateWatched)
            binding.chipDateWatched.text = "Date Watched"
            viewModel.sortByDateWatched()
        }

        binding.chipReleaseYear.setOnClickListener {
            markSelectedChip(binding.chipReleaseYear)
            showReleaseYearMenu()
        }
        
        binding.chipHighestRated.setOnClickListener {
            markSelectedChip(binding.chipHighestRated)
            showRatingMenu(isHighest = true)
        }

        binding.chipLowestRated.setOnClickListener {
            markSelectedChip(binding.chipLowestRated)
            showRatingMenu(isHighest = false)
        }

        binding.chipYear.setOnClickListener {
            markSelectedChip(binding.chipYear)
            showDecadeMenu()
        }
        
        binding.chipGenre.setOnClickListener {
            markSelectedChip(binding.chipGenre)
            showSelectionMenu(
                anchor = binding.chipGenre,
                options = genreOptions,
                allLabel = "All Genres"
            ) { selected ->
                updateFilterChipLabel(binding.chipGenre, "Genre", selected)
                viewModel.setGenre(selected)
            }
        }

        binding.chipCountry.setOnClickListener {
            markSelectedChip(binding.chipCountry)
            showSelectionMenu(
                anchor = binding.chipCountry,
                options = countryOptions,
                allLabel = "All Countries"
            ) { selected ->
                updateFilterChipLabel(binding.chipCountry, "Country", selected)
                viewModel.setCountry(selected)
            }
        }

        binding.chipLanguage.setOnClickListener {
            markSelectedChip(binding.chipLanguage)
            showSelectionMenu(
                anchor = binding.chipLanguage,
                options = languageOptions,
                allLabel = "All Languages"
            ) { selected ->
                updateFilterChipLabel(binding.chipLanguage, "Language", selected)
                viewModel.setLanguage(selected)
            }
        }

        markSelectedChip(binding.chipReleaseYear)
        binding.chipReleaseYear.text = "Release Year: Newest First"
        viewModel.sortByReleaseYear(descending = true)
    }

    private fun resetFilterChipLabels() {
        binding.chipDateWatched.text = "Date Watched"
        binding.chipReleaseYear.text = "Release Year"
        binding.chipHighestRated.text = "Highest Rated"
        binding.chipLowestRated.text = "Lowest Rated"
        binding.chipYear.text = "Year"
        binding.chipGenre.text = "Genre"
        binding.chipCountry.text = "Country"
        binding.chipLanguage.text = "Language"
    }

    private fun updateFilterChipLabel(chip: Chip, baseLabel: String, selected: String?) {
        chip.text = if (selected.isNullOrBlank()) baseLabel else "$baseLabel: $selected"
    }

    private fun markSelectedChip(selected: Chip) {
        listOf(
            binding.chipDateWatched,
            binding.chipReleaseYear,
            binding.chipHighestRated,
            binding.chipLowestRated,
            binding.chipYear,
            binding.chipGenre,
            binding.chipCountry,
            binding.chipLanguage
        ).forEach { it.isChecked = it.id == selected.id }
    }

    private fun showReleaseYearMenu() {
        PopupMenu(requireContext(), binding.chipReleaseYear).apply {
            menu.add(0, 1, 0, "Newest First")
            menu.add(0, 2, 1, "Earliest First")
            setOnMenuItemClickListener {
                when (it.itemId) {
                    1 -> {
                        binding.chipReleaseYear.text = "Release Year: Newest First"
                        viewModel.sortByReleaseYear(descending = true)
                    }
                    2 -> {
                        binding.chipReleaseYear.text = "Release Year: Earliest First"
                        viewModel.sortByReleaseYear(descending = false)
                    }
                }
                true
            }
        }.show()
    }

    private fun showRatingMenu(isHighest: Boolean) {
        PopupMenu(requireContext(), if (isHighest) binding.chipHighestRated else binding.chipLowestRated).apply {
            menu.add(0, 1, 0, "Average Rating")
            menu.add(0, 2, 1, "Your Rating")
            setOnMenuItemClickListener {
                when (it.itemId) {
                    1 -> {
                        if (isHighest) {
                            binding.chipHighestRated.text = "Highest Rated: Avg"
                            viewModel.sortByHighestRated(RatingSource.AVERAGE)
                        } else {
                            binding.chipLowestRated.text = "Lowest Rated: Avg"
                            viewModel.sortByLowestRated(RatingSource.AVERAGE)
                        }
                    }
                    2 -> {
                        if (isHighest) {
                            binding.chipHighestRated.text = "Highest Rated: Your"
                            viewModel.sortByHighestRated(RatingSource.YOUR)
                        } else {
                            binding.chipLowestRated.text = "Lowest Rated: Your"
                            viewModel.sortByLowestRated(RatingSource.YOUR)
                        }
                    }
                }
                true
            }
        }.show()
    }

    private fun showDecadeMenu() {
        PopupMenu(requireContext(), binding.chipYear).apply {
            menu.add(0, 0, 0, "All Years")
            MovieFilterUtils.getDecades().forEachIndexed { index, decade ->
                menu.add(0, index + 1, index + 1, "${decade}s")
            }
            setOnMenuItemClickListener { item ->
                if (item.itemId == 0) {
                    binding.chipYear.text = "Year"
                    viewModel.setYear(null)
                    return@setOnMenuItemClickListener true
                }
                val decade = MovieFilterUtils.getDecades()[item.itemId - 1]
                showYearMenu(decade)
                true
            }
        }.show()
    }

    private fun showYearMenu(decade: Int) {
        PopupMenu(requireContext(), binding.chipYear).apply {
            MovieFilterUtils.getYearsInDecade(decade).forEachIndexed { index, year ->
                menu.add(0, year, index, year.toString())
            }
            setOnMenuItemClickListener {
                binding.chipYear.text = "Year: ${it.itemId}"
                viewModel.setYear(it.itemId)
                true
            }
        }.show()
    }

    private fun showSelectionMenu(
        anchor: View,
        options: List<String>,
        allLabel: String,
        onSelected: (String?) -> Unit
    ) {
        PopupMenu(requireContext(), anchor).apply {
            menu.add(0, 0, 0, allLabel)
            options.distinct().sorted().forEachIndexed { index, value ->
                menu.add(0, index + 1, index + 1, value)
            }
            setOnMenuItemClickListener { item ->
                if (item.itemId == 0) {
                    onSelected(null)
                } else {
                    onSelected(item.title.toString())
                }
                true
            }
        }.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
