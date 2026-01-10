package com.komputerkit.moview.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.databinding.FragmentHomeNewBinding

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeNewBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: HomeViewModel by viewModels()
    
    private lateinit var movieCardAdapter: MovieCardAdapter
    private lateinit var friendActivityAdapter: FriendActivityNewAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeNewBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerViews()
        observeViewModel()
        setupClickListeners()
    }

    private fun setupRecyclerViews() {
        // Setup Popular Movies RecyclerView (Horizontal)
        movieCardAdapter = MovieCardAdapter { movie ->
            val action = HomeFragmentDirections.actionHomeToMovieDetail(movie.id)
            findNavController().navigate(action)
        }
        binding.rvPopularMovies.apply {
            adapter = movieCardAdapter
            layoutManager = LinearLayoutManager(
                requireContext(),
                LinearLayoutManager.HORIZONTAL,
                false
            )
        }

        // Setup Friend Activities RecyclerView (Horizontal)
        friendActivityAdapter = FriendActivityNewAdapter { activity ->
            if (activity.hasReview) {
                // Navigate to Review Detail if activity has a review
                val action = HomeFragmentDirections.actionHomeToReviewDetail(activity.id)
                findNavController().navigate(action)
            } else {
                // Navigate to Film Detail if no review
                val action = HomeFragmentDirections.actionHomeToMovieDetail(activity.movie.id)
                findNavController().navigate(action)
            }
        }
        binding.rvFriendActivities.apply {
            adapter = friendActivityAdapter
            layoutManager = LinearLayoutManager(
                requireContext(),
                LinearLayoutManager.HORIZONTAL,
                false
            )
        }
    }

    private fun observeViewModel() {
        viewModel.popularMovies.observe(viewLifecycleOwner) { movies ->
            movieCardAdapter.submitList(movies)
        }

        viewModel.friendActivities.observe(viewLifecycleOwner) { activities ->
            friendActivityAdapter.submitList(activities)
        }
    }
    
    private fun setupClickListeners() {
        binding.btnSeeAll.setOnClickListener {
            Toast.makeText(requireContext(), "See All Popular Movies", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
