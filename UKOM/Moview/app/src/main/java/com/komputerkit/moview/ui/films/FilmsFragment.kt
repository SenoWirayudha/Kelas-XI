package com.komputerkit.moview.ui.films

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.FragmentFilmsBinding

class FilmsFragment : Fragment() {

    private var _binding: FragmentFilmsBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: FilmsViewModel by viewModels()
    private lateinit var filmGridAdapter: FilmGridAdapter

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
        
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
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
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.chipDateWatched.setOnClickListener {
            viewModel.sortByDateWatched()
        }
        
        binding.chipHighestRated.setOnClickListener {
            viewModel.sortByHighestRated()
        }
        
        binding.chipGenre.setOnClickListener {
            viewModel.filterByGenre()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
