package com.komputerkit.moview.ui.diary

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.DiaryEntry
import com.komputerkit.moview.databinding.FragmentDiaryBinding

class DiaryFragment : Fragment() {

    private var _binding: FragmentDiaryBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: DiaryViewModel by viewModels()
    private lateinit var adapter: DiaryAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDiaryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupClickListeners()
        observeViewModel()
    }
    
    override fun onResume() {
        super.onResume()
        // Reload diary when returning from other screens
        viewModel.loadDiary()
    }
    
    private fun setupRecyclerView() {
        adapter = DiaryAdapter(
            onEntryClick = { entry ->
                navigateToMovieDetail(entry)
            },
            onLikeClick = { entry ->
                // TODO: Implement like functionality
                // viewModel.toggleLike(entry)
            },
            onMenuClick = { entry ->
                // Show menu options (will implement later)
            }
        )
        
        binding.rvDiary.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDiary.adapter = adapter
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun observeViewModel() {
        viewModel.diaryItems.observe(viewLifecycleOwner) { items ->
            adapter.submitList(items)
        }
    }
    
    private fun navigateToMovieDetail(entry: DiaryEntry) {
        if (entry.hasReview && entry.movie.reviewId > 0) {
            // Navigate to Review Detail if entry has a review
            val action = DiaryFragmentDirections.actionDiaryToReviewDetail(
                reviewId = entry.movie.reviewId,
                isLog = false
            )
            findNavController().navigate(action)
        } else {
            // Navigate to Review Detail as Log (without review text)
            val action = DiaryFragmentDirections.actionDiaryToReviewDetail(
                reviewId = entry.id,  // Pass diary_id as reviewId for log entries
                isLog = true
            )
            findNavController().navigate(action)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
