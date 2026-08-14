package com.komputerkit.moview.ui.watchlist

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.data.model.WatchlistItem
import com.komputerkit.moview.databinding.FragmentWatchlistBinding
import com.komputerkit.moview.ui.common.FilterSheetDialog
import com.komputerkit.moview.ui.common.FilterSheetOptions
import com.komputerkit.moview.ui.common.FilterSheetResult
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
    private var themeOptions: List<String> = emptyList()

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
                dateOptions = listOf("Date Added")
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
                    "Date Added" -> viewModel.sortByDateAdded()
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

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun observeViewModel() {
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }
        viewModel.watchlistItems.observe(viewLifecycleOwner) { items ->
            adapter.submitList(items)
            binding.tvEmpty.visibility = if (items.isEmpty()) View.VISIBLE else View.GONE
        }

        viewModel.genres.observe(viewLifecycleOwner) { genreOptions = it }
        viewModel.countries.observe(viewLifecycleOwner) { countryOptions = it }
        viewModel.languages.observe(viewLifecycleOwner) { languageOptions = it }
        viewModel.themes.observe(viewLifecycleOwner) { themeOptions = it }
    }
    
    private fun navigateToMovieDetail(item: WatchlistItem) {
        val action = WatchlistFragmentDirections.actionWatchlistToMovieDetail(item.movie.id)
        findNavController().navigate(action)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
