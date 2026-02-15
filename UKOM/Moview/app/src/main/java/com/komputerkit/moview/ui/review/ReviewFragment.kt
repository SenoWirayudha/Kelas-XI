package com.komputerkit.moview.ui.review

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
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.data.model.Review
import com.komputerkit.moview.databinding.FragmentReviewBinding

class ReviewFragment : Fragment() {

    private var _binding: FragmentReviewBinding? = null
    private val binding get() = _binding!!
    private val args: ReviewFragmentArgs by navArgs()
    
    private val viewModel: ReviewViewModel by viewModels()
    private lateinit var adapter: ReviewAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReviewBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get userId from args or use current user
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val targetUserId = if (args.userId > 0) args.userId else currentUserId
        
        viewModel.loadReviews(targetUserId)
        
        setupRecyclerView()
        setupClickListeners()
        observeViewModel()
    }
    
    private fun setupRecyclerView() {
        adapter = ReviewAdapter { review ->
            navigateToReviewDetail(review)
        }
        
        binding.rvReviews.layoutManager = LinearLayoutManager(requireContext())
        binding.rvReviews.adapter = adapter
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun observeViewModel() {
        viewModel.reviews.observe(viewLifecycleOwner) { reviews ->
            adapter.submitList(reviews)
        }
    }
    
    private fun navigateToReviewDetail(review: Review) {
        val action = ReviewFragmentDirections.actionReviewToReviewDetail(review.id)
        findNavController().navigate(action)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
