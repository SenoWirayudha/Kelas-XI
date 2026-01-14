package com.komputerkit.moview.ui.filmography

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

class FilmographyFragment : Fragment() {

    private var _binding: FragmentFilmographyBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: FilmographyViewModel by viewModels()
    private val args: FilmographyFragmentArgs by navArgs()
    
    private lateinit var filmographyAdapter: FilmographyAdapter

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
        setupRecyclerView()
        setupObservers()
        
        // Load filmography based on filter
        viewModel.loadFilmography(args.filterType, args.filterValue)
    }
    
    private fun setupToolbar() {
        binding.tvTitle.text = args.filterValue
        
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun setupRecyclerView() {
        filmographyAdapter = FilmographyAdapter(
            onMovieClick = { movie ->
                // Navigate to Film Detail
                val action = FilmographyFragmentDirections
                    .actionFilmographyToMovieDetail(movie.id)
                findNavController().navigate(action)
            }
        )
        
        binding.rvFilmography.apply {
            adapter = filmographyAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
        }
    }
    
    private fun setupObservers() {
        viewModel.films.observe(viewLifecycleOwner) { films ->
            filmographyAdapter.submitList(films)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
