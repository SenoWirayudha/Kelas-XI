package com.komputerkit.moview.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.databinding.FragmentUserFilmActivityTabBinding
import com.komputerkit.moview.ui.adapter.SimpleDiaryAdapter
import com.komputerkit.moview.ui.adapter.SimpleReviewAdapter
import com.komputerkit.moview.ui.viewmodel.UserFilmActivityViewModel

class UserFilmActivityTabFragment : Fragment() {
    private var _binding: FragmentUserFilmActivityTabBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: UserFilmActivityViewModel by activityViewModels()
    
    private var tabType: Int = TAB_DIARY
    private var userId: Int = 0
    private var filmId: Int = 0
    
    private lateinit var diaryAdapter: SimpleDiaryAdapter
    private lateinit var reviewAdapter: SimpleReviewAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            tabType = it.getInt(ARG_TAB_TYPE, TAB_DIARY)
            userId = it.getInt(ARG_USER_ID, 0)
            filmId = it.getInt(ARG_FILM_ID, 0)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentUserFilmActivityTabBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupObservers()
    }
    
    private fun setupRecyclerView() {
        binding.rvList.layoutManager = LinearLayoutManager(requireContext())
        
        android.util.Log.d("UserFilmActivityTab", "setupRecyclerView - tabType: $tabType")
        
        when (tabType) {
            TAB_DIARY -> {
                diaryAdapter = SimpleDiaryAdapter { id, isLog ->
                    val action = UserFilmActivityFragmentDirections.actionUserFilmActivityToReviewDetail(id, isLog)
                    findNavController().navigate(action)
                }
                binding.rvList.adapter = diaryAdapter
                android.util.Log.d("UserFilmActivityTab", "Diary adapter set")
            }
            TAB_REVIEWS -> {
                reviewAdapter = SimpleReviewAdapter { reviewId ->
                    // Navigate to ReviewDetail
                    val action = UserFilmActivityFragmentDirections.actionUserFilmActivityToReviewDetail(reviewId)
                    findNavController().navigate(action)
                }
                binding.rvList.adapter = reviewAdapter
                android.util.Log.d("UserFilmActivityTab", "Review adapter set")
            }
        }
    }
    
    private fun setupObservers() {
        android.util.Log.d("UserFilmActivityTab", "setupObservers - tabType: $tabType")
        
        when (tabType) {
            TAB_DIARY -> {
                viewModel.diaries.observe(viewLifecycleOwner) { diaries ->
                    android.util.Log.d("UserFilmActivityTab", "Diaries received: ${diaries.size} items")
                    if (::diaryAdapter.isInitialized) {
                        diaryAdapter.submitList(diaries)
                        updateEmptyState(diaries.isEmpty())
                    } else {
                        android.util.Log.e("UserFilmActivityTab", "Diary adapter not initialized!")
                    }
                }
            }
            TAB_REVIEWS -> {
                viewModel.reviews.observe(viewLifecycleOwner) { reviews ->
                    android.util.Log.d("UserFilmActivityTab", "Reviews received: ${reviews.size} items")
                    if (::reviewAdapter.isInitialized) {
                        reviewAdapter.submitList(reviews)
                        updateEmptyState(reviews.isEmpty())
                    } else {
                        android.util.Log.e("UserFilmActivityTab", "Review adapter not initialized!")
                    }
                }
            }
        }
    }
    
    private fun updateEmptyState(isEmpty: Boolean) {
        binding.tvEmpty.visibility = if (isEmpty) View.VISIBLE else View.GONE
        binding.rvList.visibility = if (isEmpty) View.GONE else View.VISIBLE
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAB_DIARY = 0
        const val TAB_REVIEWS = 1
        
        private const val ARG_TAB_TYPE = "tab_type"
        private const val ARG_USER_ID = "user_id"
        private const val ARG_FILM_ID = "film_id"

        fun newInstance(tabType: Int, userId: Int, filmId: Int) = UserFilmActivityTabFragment().apply {
            arguments = Bundle().apply {
                putInt(ARG_TAB_TYPE, tabType)
                putInt(ARG_USER_ID, userId)
                putInt(ARG_FILM_ID, filmId)
            }
        }
    }
}
