package com.komputerkit.moview.ui.watchlist

import android.content.Context
import android.os.Bundle
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
import com.komputerkit.moview.data.model.WatchlistItem
import com.komputerkit.moview.databinding.FragmentWatchlistBinding
import com.komputerkit.moview.ui.common.MovieFilterUtils
import com.komputerkit.moview.ui.common.RatingSource

class WatchlistFragment : Fragment() {

    private var _binding: FragmentWatchlistBinding? = null
    private val binding get() = _binding!!
    private val args: WatchlistFragmentArgs by navArgs()
    
    private val viewModel: WatchlistViewModel by viewModels()
    private lateinit var adapter: WatchlistAdapter
    private var genreOptions: List<String> = emptyList()
    private var countryOptions: List<String> = emptyList()
    private var languageOptions: List<String> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWatchlistBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        viewModel.loadWatchlist(targetUserId)
        
        setupRecyclerView()
        setupFilters()
        setupClickListeners()
        observeViewModel()
    }
    
    override fun onResume() {
        super.onResume()
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        viewModel.loadWatchlist(targetUserId)
    }
    
    private fun setupRecyclerView() {
        adapter = WatchlistAdapter(
            onItemClick = { item ->
                navigateToMovieDetail(item)
            },
            onItemLongClick = { item ->
                // TODO: Show bottom sheet action panel
                Toast.makeText(requireContext(), "Long press on ${item.movie.title}", Toast.LENGTH_SHORT).show()
            },
            onLogFilm = { item ->
                val action = WatchlistFragmentDirections.actionWatchlistToLogFilm(item.movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { item ->
                val action = WatchlistFragmentDirections.actionWatchlistToPosterBackdrop(item.movie.id, false)
                findNavController().navigate(action)
            }
        )
        
        binding.rvWatchlist.layoutManager = GridLayoutManager(requireContext(), 4)
        binding.rvWatchlist.adapter = adapter
    }
    
    private fun setupFilters() {
        resetFilterChipLabels()

        binding.chipDateAdded.setOnClickListener {
            markSelectedChip(binding.chipDateAdded)
            binding.chipDateAdded.text = "Date Added"
            viewModel.sortByDateAdded()
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
            showSelectionMenu(binding.chipGenre, genreOptions, "All Genres") { selected ->
                updateFilterChipLabel(binding.chipGenre, "Genre", selected)
                viewModel.setGenre(selected)
            }
        }

        binding.chipCountry.setOnClickListener {
            markSelectedChip(binding.chipCountry)
            showSelectionMenu(binding.chipCountry, countryOptions, "All Countries") { selected ->
                updateFilterChipLabel(binding.chipCountry, "Country", selected)
                viewModel.setCountry(selected)
            }
        }

        binding.chipLanguage.setOnClickListener {
            markSelectedChip(binding.chipLanguage)
            showSelectionMenu(binding.chipLanguage, languageOptions, "All Languages") { selected ->
                updateFilterChipLabel(binding.chipLanguage, "Language", selected)
                viewModel.setLanguage(selected)
            }
        }

        markSelectedChip(binding.chipReleaseYear)
        binding.chipReleaseYear.text = "Release Year: Newest First"
        viewModel.sortByReleaseYear(descending = true)
    }

    private fun resetFilterChipLabels() {
        binding.chipDateAdded.text = "Date Added"
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
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun observeViewModel() {
        viewModel.watchlistItems.observe(viewLifecycleOwner) { items ->
            adapter.submitList(items)
        }

        viewModel.genres.observe(viewLifecycleOwner) { genreOptions = it }
        viewModel.countries.observe(viewLifecycleOwner) { countryOptions = it }
        viewModel.languages.observe(viewLifecycleOwner) { languageOptions = it }
    }
    
    private fun navigateToMovieDetail(item: WatchlistItem) {
        val action = WatchlistFragmentDirections.actionWatchlistToMovieDetail(item.movie.id)
        findNavController().navigate(action)
    }

    private fun markSelectedChip(selected: Chip) {
        listOf(
            binding.chipDateAdded,
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

    private fun showSelectionMenu(anchor: View, options: List<String>, allLabel: String, onSelected: (String?) -> Unit) {
        PopupMenu(requireContext(), anchor).apply {
            menu.add(0, 0, 0, allLabel)
            options.distinct().sorted().forEachIndexed { index, value ->
                menu.add(0, index + 1, index + 1, value)
            }
            setOnMenuItemClickListener { item ->
                if (item.itemId == 0) onSelected(null) else onSelected(item.title.toString())
                true
            }
        }.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
