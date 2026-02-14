package com.komputerkit.moview.ui.likes

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.FragmentLikesBinding
import com.komputerkit.moview.ui.films.FilmGridAdapter

class LikesFragment : Fragment() {

    private var _binding: FragmentLikesBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: LikesViewModel by viewModels()
    private lateinit var filmGridAdapter: FilmGridAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLikesBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
    }
    
    override fun onResume() {
        super.onResume()
        viewModel.loadLikes()
    }
    
    private fun setupRecyclerView() {
        filmGridAdapter = FilmGridAdapter(
            onMovieClick = { movie ->
                // If has review, go to review detail, otherwise go to movie detail
                if (movie.hasReview && movie.reviewId > 0) {
                    val action = LikesFragmentDirections.actionLikesToReviewDetail(movie.reviewId)
                    findNavController().navigate(action)
                } else {
                    val action = LikesFragmentDirections.actionLikesToMovieDetail(movie.id)
                    findNavController().navigate(action)
                }
            },
            onReviewClick = { movie ->
                val action = LikesFragmentDirections.actionLikesToReviewDetail(movie.reviewId)
                findNavController().navigate(action)
            }
        )
        
        binding.rvLikes.apply {
            adapter = filmGridAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
        }
    }
    
    private fun setupObservers() {
        viewModel.likes.observe(viewLifecycleOwner) { films ->
            filmGridAdapter.submitList(films)
            binding.emptyState.isVisible = films.isEmpty() && viewModel.isLoading.value != true
        }
        
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.isVisible = isLoading
            binding.rvLikes.isVisible = !isLoading
        }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.chipDateLiked.setOnClickListener {
            viewModel.sortByDateLiked()
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
