package com.komputerkit.moview.ui.reviews

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.databinding.FragmentReviewsListBinding

class ReviewsListFragment : Fragment() {

    private var _binding: FragmentReviewsListBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: ReviewsListViewModel by viewModels()
    private val args: ReviewsListFragmentArgs by navArgs()
    
    private lateinit var reviewsAdapter: ReviewsAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReviewsListBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupToolbar()
        setupRecyclerView()
        setupObservers()
        
        // Load reviews for the movie
        viewModel.loadReviews(args.movieId)
    }
    
    private fun setupToolbar() {
        binding.tvTitle.text = "Reviews of ${args.movieTitle}"
        
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun setupRecyclerView() {
        reviewsAdapter = ReviewsAdapter { review ->
            // Navigate to Review Detail
            val action = ReviewsListFragmentDirections
                .actionReviewsListToReviewDetail(review.id)
            findNavController().navigate(action)
        }
        
        binding.rvReviews.apply {
            adapter = reviewsAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }
    
    private fun setupObservers() {
        viewModel.reviews.observe(viewLifecycleOwner) { reviews ->
            reviewsAdapter.submitList(reviews)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
