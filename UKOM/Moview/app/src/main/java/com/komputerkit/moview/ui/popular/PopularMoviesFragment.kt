package com.komputerkit.moview.ui.popular

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.komputerkit.moview.databinding.FragmentPopularMoviesBinding
import com.komputerkit.moview.ui.social.GridSpacingItemDecoration

class PopularMoviesFragment : Fragment(), SwipeRefreshLayout.OnRefreshListener {

    private var _binding: FragmentPopularMoviesBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: PopularMoviesViewModel by viewModels()
    private lateinit var adapter: MovieGridAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPopularMoviesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupToolbar()
        setupRecyclerView()
        setupSwipeRefresh()
        observeViewModel()
        
        // Load data
        viewModel.loadPopularMovies()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener(this)
    }

    private fun setupRecyclerView() {
        adapter = MovieGridAdapter(
            onMovieClick = { movie ->
                android.util.Log.d("PopularMoviesFragment", "Movie clicked: ${movie.id}")
                try {
                    val action = PopularMoviesFragmentDirections
                        .actionPopularMoviesToMovieDetail(movieId = movie.id)
                    findNavController().navigate(action)
                } catch (e: Exception) {
                    android.util.Log.e("PopularMoviesFragment", "Navigation error", e)
                    Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        )
        
        binding.rvPopularMovies.apply {
            val gridLayoutManager = GridLayoutManager(requireContext(), 3)
            layoutManager = gridLayoutManager
            adapter = this@PopularMoviesFragment.adapter
            
            // Add spacing between items
            addItemDecoration(GridSpacingItemDecoration(3, 16, true))
        }
    }
    
    override fun onRefresh() {
        android.util.Log.d("PopularMoviesFragment", "Refreshing...")
        viewModel.loadPopularMovies()
    }

    private fun observeViewModel() {
        viewModel.movies.observe(viewLifecycleOwner) { movies ->
            android.util.Log.d("PopularMoviesFragment", "Movies received: ${movies.size}")
            
            if (movies.isEmpty()) {
                binding.emptyState.visibility = View.VISIBLE
                binding.rvPopularMovies.visibility = View.GONE
            } else {
                binding.emptyState.visibility = View.GONE
                binding.rvPopularMovies.visibility = View.VISIBLE
                adapter.submitList(movies)
            }
        }
        
        viewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading && !binding.swipeRefresh.isRefreshing) View.VISIBLE else View.GONE
            if (!isLoading) {
                binding.swipeRefresh.isRefreshing = false
            }
        }
        
        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                android.util.Log.e("PopularMoviesFragment", "Error: $it")
                Toast.makeText(requireContext(), it, Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
