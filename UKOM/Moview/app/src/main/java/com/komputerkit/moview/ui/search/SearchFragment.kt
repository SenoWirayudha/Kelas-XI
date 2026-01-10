package com.komputerkit.moview.ui.search

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.flexbox.FlexDirection
import com.google.android.flexbox.FlexboxLayoutManager
import com.google.android.flexbox.JustifyContent
import com.komputerkit.moview.databinding.FragmentSearchNewBinding

class SearchFragment : Fragment() {

    private var _binding: FragmentSearchNewBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: SearchViewModel by viewModels()
    
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
        
        setupRecyclerViews()
        observeViewModel()
    }
    
    private fun setupRecyclerViews() {
        // Movies
        movieAdapter = SearchMovieAdapter { movie ->
            val action = SearchFragmentDirections.actionSearchToMovieDetail(movie.id)
            findNavController().navigate(action)
        }
        binding.rvMovies.apply {
            adapter = movieAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // People
        personAdapter = SearchPersonAdapter()
        binding.rvPeople.apply {
            adapter = personAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
        
        // Studios - using FlexboxLayoutManager for chip layout
        studioAdapter = SearchStudioAdapter()
        binding.rvStudios.apply {
            adapter = studioAdapter
            layoutManager = FlexboxLayoutManager(requireContext()).apply {
                flexDirection = FlexDirection.ROW
                justifyContent = JustifyContent.FLEX_START
            }
        }
    }
    
    private fun observeViewModel() {
        viewModel.movies.observe(viewLifecycleOwner) { movies ->
            movieAdapter.submitList(movies)
        }
        
        viewModel.people.observe(viewLifecycleOwner) { people ->
            personAdapter.submitList(people)
        }
        
        viewModel.studios.observe(viewLifecycleOwner) { studios ->
            studioAdapter.submitList(studios)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
