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
    private lateinit var personAdapter: SearchPersonAdapter
    private lateinit var studioAdapter: SearchStudioAdapter

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
        setupRecyclerViews()
        observeUiState()
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
        movieAdapter = SearchMovieAdapter { movie ->
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
        binding.rvMovies.apply {
            adapter = movieAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // People - navigate to crew detail
        personAdapter = SearchPersonAdapter { person ->
            // Navigate to Crew/Actor/Director Detail Screen
            val action = SearchFragmentDirections.actionSearchToCrewDetail(person.id)
            findNavController().navigate(action)
        }
        binding.rvPeople.apply {
            adapter = personAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // Studios - placeholder for now
        studioAdapter = SearchStudioAdapter { studio ->
            // TODO: Navigate to Studio Filmography Screen (future implementation)
            Toast.makeText(requireContext(), "Studio: ${studio.name} (Coming soon)", Toast.LENGTH_SHORT).show()
        }
        binding.rvStudios.apply {
            adapter = studioAdapter
            layoutManager = FlexboxLayoutManager(requireContext()).apply {
                flexDirection = FlexDirection.ROW
                justifyContent = JustifyContent.FLEX_START
            }
        }
    }
    
    private fun observeUiState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                updateUi(state)
            }
        }
    }
    
    private fun updateUi(state: SearchUiState) {
        // Show/hide loading indicator
        binding.progressBar.isVisible = state.isLoading
        
        // Update movie section
        val hasMovies = state.movieResults.isNotEmpty()
        binding.sectionMovies.isVisible = hasMovies
        movieAdapter.submitList(state.movieResults)
        binding.tvMoviesCount.text = if (hasMovies) "View ${state.movieResults.size}" else ""
        
        // In SELECT_MOVIE_MODE, hide people and studios sections
        if (state.isSelectMovieMode) {
            binding.sectionPeople.isVisible = false
            binding.sectionStudios.isVisible = false
        } else {
            // Update people section
            val hasPeople = state.personResults.isNotEmpty()
            binding.sectionPeople.isVisible = hasPeople
            personAdapter.submitList(state.personResults)
            
            // Update studios section
            val hasStudios = state.studioResults.isNotEmpty()
            binding.sectionStudios.isVisible = hasStudios
            studioAdapter.submitList(state.studioResults)
        }
        
        // Show empty state
        val showEmpty = !state.isLoading && state.isEmpty && state.query.isNotEmpty()
        binding.emptyState.isVisible = showEmpty
        
        // Show error if any
        state.error?.let { error ->
            Toast.makeText(requireContext(), error, Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
