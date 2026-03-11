package com.komputerkit.moview.ui.theatrical

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
import com.komputerkit.moview.databinding.FragmentUpcomingBinding
import com.komputerkit.moview.ui.home.TheatricalMovieAdapter
import com.komputerkit.moview.ui.social.GridSpacingItemDecoration

class UpcomingFragment : Fragment(), SwipeRefreshLayout.OnRefreshListener {

    private var _binding: FragmentUpcomingBinding? = null
    private val binding get() = _binding!!

    private val viewModel: UpcomingViewModel by viewModels()
    private lateinit var adapter: TheatricalMovieAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentUpcomingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        adapter = TheatricalMovieAdapter(
            onMovieClick = { movie ->
                val action = UpcomingFragmentDirections.actionUpcomingToMovieDetail(movieId = movie.id)
                findNavController().navigate(action)
            },
            showDateBadge = true,
            onLogFilm = { movie ->
                val action = UpcomingFragmentDirections.actionUpcomingToLogFilm(movieId = movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = UpcomingFragmentDirections.actionUpcomingToPosterBackdrop(movieId = movie.id, openBackdropsTab = false)
                findNavController().navigate(action)
            }
        )

        binding.rvMovies.apply {
            layoutManager = GridLayoutManager(requireContext(), 3)
            adapter = this@UpcomingFragment.adapter
            val spacingPx = (12 * resources.displayMetrics.density).toInt()
            addItemDecoration(GridSpacingItemDecoration(3, spacingPx, false))
        }

        binding.swipeRefresh.setOnRefreshListener(this)

        viewModel.movies.observe(viewLifecycleOwner) { movies ->
            if (movies.isEmpty()) {
                binding.emptyState.visibility = View.VISIBLE
                binding.rvMovies.visibility = View.GONE
            } else {
                binding.emptyState.visibility = View.GONE
                binding.rvMovies.visibility = View.VISIBLE
                adapter.submitList(movies)
            }
        }

        viewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility =
                if (isLoading && !binding.swipeRefresh.isRefreshing) View.VISIBLE else View.GONE
            if (!isLoading) binding.swipeRefresh.isRefreshing = false
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let { Toast.makeText(requireContext(), it, Toast.LENGTH_SHORT).show() }
        }

        viewModel.loadMovies()
    }

    override fun onRefresh() { viewModel.loadMovies() }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
