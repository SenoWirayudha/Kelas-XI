package com.komputerkit.moview.ui.search

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.Toast
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
import com.komputerkit.moview.databinding.FragmentSearchNewBinding
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
        
        setupSearchBar()
        setupFilterChips()
        setupRecyclerViews()
        observeUiState()
    }
    
    private fun setupFilterChips() {
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
                viewModel.onQueryChanged(query)
                binding.btnClear.isVisible = query.isNotEmpty()
            }
        })
        
        // Search action (Enter key)
        binding.etSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                val query = binding.etSearch.text.toString()
                viewModel.onSearchSubmit(query)
                true
            } else {
                false
            }
        }
        
        // Clear button
        binding.btnClear.setOnClickListener {
            binding.etSearch.text?.clear()
            viewModel.clearSearch()
        }
        
        // Cancel button
        binding.btnCancel.setOnClickListener {
            binding.etSearch.text?.clear()
            viewModel.clearSearch()
        }
    }
    
    private fun setupRecyclerViews() {
        // Movies - handle click based on mode
        movieAdapter = SearchMovieAdapter(
            onMovieClick = { movie ->
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
            }
        )
        binding.rvMovies.apply {
            adapter = movieAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // Cast & Crew - navigate to person detail
        castCrewAdapter = SearchPersonAdapter { person ->
            val action = SearchFragmentDirections.actionSearchToCrewDetail(person.id)
            findNavController().navigate(action)
        }
        binding.rvCastCrew.apply {
            adapter = castCrewAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // Production Houses - navigate to filmography
        productionHouseAdapter = SearchStudioAdapter { studio ->
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
                
                // Show error if any
                state.error?.let { error ->
                    Toast.makeText(requireContext(), error, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
