package com.komputerkit.moview.ui.search

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.flexbox.FlexDirection
import com.google.android.flexbox.FlexboxLayoutManager
import com.google.android.flexbox.JustifyContent
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentSearchNewBinding
import com.komputerkit.moview.util.postponeEnterUntilLaidOut
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class SearchFragment : Fragment() {

    private var _binding: FragmentSearchNewBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: SearchViewModel by viewModels()
    private val args: SearchFragmentArgs by navArgs()
    
    private lateinit var movieAdapter: SearchMovieAdapter
    private lateinit var castCrewAdapter: SearchPersonAdapter
    private lateinit var productionHouseAdapter: SearchStudioAdapter
    private lateinit var userAdapter: SearchUserAdapter
    private lateinit var historyAdapter: SearchHistoryAdapter

    private var syncingQuery = false
    private var userId = 0

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSearchNewBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Set SELECT_MOVIE_MODE if passed from navigation
        if (args.selectMovieMode) {
            viewModel.setSelectMovieMode(true)
        }
        
        setupSearchHistory()
        setupSearchBar()
        setupFilterChips()
        setupRecyclerViews()
        observeUiState()
        syncQueryFromState()

        postponeEnterUntilLaidOut()

        // Restore scroll position saved before navigating away
        binding.searchScroll.post {
            binding.searchScroll.scrollTo(0, viewModel.savedScrollY)
        }
    }
    
    private fun setupFilterChips() {
        // Force Inter — XML style alone is ignored by Chip's internal TextAppearance (phone default shows instead)
        val inter = androidx.core.content.res.ResourcesCompat.getFont(requireContext(), R.font.font_family_inter)
        listOf(binding.chipAll, binding.chipMovies, binding.chipCastCrew, binding.chipProductionHouses, binding.chipPeople).forEach { it.typeface = inter }

        binding.chipAll.setOnClickListener {
            viewModel.setFilter(SearchFilter.ALL)
        }
        
        binding.chipMovies.setOnClickListener {
            viewModel.setFilter(SearchFilter.MOVIES)
        }
        
        binding.chipCastCrew.setOnClickListener {
            viewModel.setFilter(SearchFilter.CAST_CREW)
        }
        
        binding.chipProductionHouses.setOnClickListener {
            viewModel.setFilter(SearchFilter.PRODUCTION_HOUSES)
        }
        
        binding.chipPeople.setOnClickListener {
            viewModel.setFilter(SearchFilter.PEOPLE)
        }
    }
    
    private fun setupSearchBar() {
        // Text change listener with debounce
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val query = s?.toString() ?: ""
                if (!syncingQuery) {
                    viewModel.onQueryChanged(query)
                }
                binding.btnClear.isVisible = query.isNotEmpty()
                updateHistoryVisibility(query)
            }
        })
        
        // Search action (Enter key)
        binding.etSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                val query = binding.etSearch.text.toString()
                rememberSearch(query)
                viewModel.onSearchSubmit(query)
                true
            } else {
                false
            }
        }
        
        // Clear (X) button — empties the field, keeps focus, reveals the history
        binding.btnClear.setOnClickListener {
            setQueryText("")
            viewModel.clearSearch()
            updateHistoryVisibility("")
            binding.etSearch.requestFocus()
            val imm = requireContext()
                .getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as? android.view.inputmethod.InputMethodManager
            imm?.showSoftInput(binding.etSearch, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
        }

        // Cancel button — only used by the movie-picker flow (bottom nav hidden)
        binding.btnCancel.setOnClickListener {
            if (viewModel.uiState.value.isSelectMovieMode) {
                findNavController().navigateUp()
            }
        }
    }

    private fun setupSearchHistory() {
        userId = requireContext()
            .getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
            .getInt("userId", 0)

        historyAdapter = SearchHistoryAdapter(
            onKeywordClick = { keyword ->
                setQueryText(keyword)
                rememberSearch(keyword)
                viewModel.onQueryChanged(keyword)
                viewModel.onSearchSubmit(keyword)
                binding.etSearch.clearFocus()
            },
            onDeleteClick = { keyword ->
                renderHistory(SearchHistoryStore.remove(requireContext(), userId, keyword))
            }
        )

        binding.rvHistory.apply {
            adapter = historyAdapter
            layoutManager = LinearLayoutManager(requireContext())
            itemAnimator = null
        }

        binding.btnClearHistory.setOnClickListener {
            SearchHistoryStore.clear(requireContext(), userId)
            renderHistory(emptyList())
        }

        renderHistory(SearchHistoryStore.load(requireContext(), userId))
    }

    /** Persists the keyword for the current account and refreshes the section. */
    private fun rememberSearch(keyword: String) {
        if (keyword.isBlank()) return
        renderHistory(SearchHistoryStore.add(requireContext(), userId, keyword))
    }

    private fun renderHistory(entries: List<String>) {
        historyAdapter.submitList(entries)
        if (_binding != null) updateHistoryVisibility(binding.etSearch.text?.toString() ?: "")
    }

    /** History is visible only while the search field is empty and has entries. */
    private fun updateHistoryVisibility(query: String) {
        val hasHistory = historyAdapter.itemCount > 0
        binding.sectionHistory.isVisible = query.isEmpty() && hasHistory
    }

    private fun setQueryText(text: String) {
        if (binding.etSearch.text.toString() == text) return
        syncingQuery = true
        binding.etSearch.setText(text)
        binding.etSearch.setSelection(text.length)
        syncingQuery = false
        binding.btnClear.isVisible = text.isNotEmpty()
    }

    private fun syncQueryFromState() {
        val vmQuery = viewModel.uiState.value.query
        val viewText = binding.etSearch.text?.toString() ?: ""
        when {
            vmQuery.isNotEmpty() && vmQuery != viewText -> setQueryText(vmQuery)
            vmQuery.isEmpty() && viewText.isNotEmpty() -> viewModel.onQueryChanged(viewText)
        }
    }
    
    private fun setupRecyclerViews() {
        // Movies - handle click based on mode
        movieAdapter = SearchMovieAdapter(
            onMovieClick = { movie ->
                rememberSearch(binding.etSearch.text?.toString() ?: "")
                if (viewModel.uiState.value.isSelectMovieMode) {
                    // SELECT_MOVIE mode: Return selected movie ID
                    findNavController().previousBackStackEntry?.savedStateHandle?.set("selected_movie_id", movie.id)
                    findNavController().previousBackStackEntry?.savedStateHandle?.set("slot_index", args.slotIndex)
                    findNavController().navigateUp()
                } else {
                    // Normal mode: navigate to movie detail
                    val action = SearchFragmentDirections.actionSearchToMovieDetail(movie.id)
                    findNavController().navigate(action)
                }
            },
            onLogFilm = { movie ->
                val action = SearchFragmentDirections.actionSearchToLogFilm(movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = SearchFragmentDirections.actionSearchToPosterBackdrop(movie.id, false)
                findNavController().navigate(action)
            }
        )
        binding.rvMovies.apply {
            adapter = movieAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // Cast & Crew - navigate to person detail
        castCrewAdapter = SearchPersonAdapter { person ->
            rememberSearch(binding.etSearch.text?.toString() ?: "")
            val action = SearchFragmentDirections.actionSearchToCrewDetail(person.id)
            findNavController().navigate(action)
        }
        binding.rvCastCrew.apply {
            adapter = castCrewAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // Production Houses - navigate to filmography
        productionHouseAdapter = SearchStudioAdapter { studio ->
            rememberSearch(binding.etSearch.text?.toString() ?: "")
            val action = SearchFragmentDirections.actionSearchToFilmList(
                categoryType = "production_house",
                categoryValue = studio.name,
                categoryName = studio.name
            )
            findNavController().navigate(action)
        }
        binding.rvProductionHouses.apply {
            adapter = productionHouseAdapter
            layoutManager = FlexboxLayoutManager(requireContext()).apply {
                flexDirection = FlexDirection.ROW
                justifyContent = JustifyContent.FLEX_START
            }
        }
        
        // Users - navigate to user profile
        userAdapter = SearchUserAdapter { user ->
            rememberSearch(binding.etSearch.text?.toString() ?: "")
            val action = SearchFragmentDirections.actionSearchToUserProfile(user.id)
            findNavController().navigate(action)
        }
        binding.rvUsers.apply {
            adapter = userAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }
    
    private fun observeUiState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                // Loading indicator
                binding.progressBar.isVisible = state.isLoading

                // Update filter chip selection
                binding.chipAll.isChecked = state.activeFilter == SearchFilter.ALL
                binding.chipMovies.isChecked = state.activeFilter == SearchFilter.MOVIES
                binding.chipCastCrew.isChecked = state.activeFilter == SearchFilter.CAST_CREW
                binding.chipProductionHouses.isChecked = state.activeFilter == SearchFilter.PRODUCTION_HOUSES
                binding.chipPeople.isChecked = state.activeFilter == SearchFilter.PEOPLE
                
                // In SELECT_MOVIE_MODE, only show movies
                if (state.isSelectMovieMode) {
                    // Update movie section
                    val hasMovies = state.movieResults.isNotEmpty()
                    binding.sectionMovies.isVisible = hasMovies
                    movieAdapter.submitList(state.movieResults)
                    binding.tvMoviesCount.text = if (hasMovies) "View ${state.movieResults.size}" else ""
                    
                    // Hide all other sections
                    binding.sectionCastCrew.isVisible = false
                    binding.sectionProductionHouses.isVisible = false
                    binding.sectionUsers.isVisible = false
                    binding.filterChips.isVisible = false
                } else {
                    // Normal mode: show sections based on filter
                    binding.filterChips.isVisible = true
                    
                    // Movies section
                    val hasMovies = state.movieResults.isNotEmpty()
                    binding.sectionMovies.isVisible = hasMovies
                    movieAdapter.submitList(state.movieResults)
                    binding.tvMoviesCount.text = if (hasMovies) "View ${state.movieResults.size}" else ""
                    
                    // Cast & Crew section
                    val hasCastCrew = state.castCrewResults.isNotEmpty()
                    binding.sectionCastCrew.isVisible = hasCastCrew
                    castCrewAdapter.submitList(state.castCrewResults)
                    
                    // Production Houses section
                    val hasProductionHouses = state.productionHouseResults.isNotEmpty()
                    binding.sectionProductionHouses.isVisible = hasProductionHouses
                    productionHouseAdapter.submitList(state.productionHouseResults)
                    
                    // Users section
                    val hasUsers = state.userResults.isNotEmpty()
                    binding.sectionUsers.isVisible = hasUsers
                    userAdapter.submitList(state.userResults)
                }
                
                // Show empty state
                val showEmpty = !state.isLoading && state.isEmpty && state.query.isNotEmpty()
                binding.emptyState.isVisible = showEmpty

                // Recent searches only while the field is empty; Cancel only in the
                // movie-picker flow (where the bottom nav is hidden).
                updateHistoryVisibility(binding.etSearch.text?.toString() ?: "")
                binding.btnCancel.isVisible = state.isSelectMovieMode
                
                // Show error if any
                state.error?.let { error ->
                    showSnackbar(error, SnackbarType.ERROR)
                }
            }
        }
    }

    override fun onStop() {
        super.onStop()
        viewModel.savedScrollY = binding.searchScroll.scrollY
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
