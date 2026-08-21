package com.komputerkit.moview.ui.theatrical

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.komputerkit.moview.databinding.FragmentComingSoonBinding
import com.komputerkit.moview.ui.home.TheatricalMovieAdapter
import com.komputerkit.moview.ui.social.GridSpacingItemDecoration
import com.komputerkit.moview.util.ScrollStateHelper
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.showSnackbar

class ComingSoonFragment : Fragment(), SwipeRefreshLayout.OnRefreshListener {

    private var _binding: FragmentComingSoonBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ComingSoonViewModel by viewModels()
    private lateinit var adapter: TheatricalMovieAdapter
    private var savedScrollState: Pair<Int, Int>? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentComingSoonBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        adapter = TheatricalMovieAdapter(
            onMovieClick = { movie ->
                val action = ComingSoonFragmentDirections.actionComingSoonToMovieDetail(movieId = movie.id)
                findNavController().navigate(action)
            },
            showDateBadge = true,
            gridMode = true,
            onLogFilm = { movie ->
                val action = ComingSoonFragmentDirections.actionComingSoonToLogFilm(movieId = movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = ComingSoonFragmentDirections.actionComingSoonToPosterBackdrop(movieId = movie.id, openBackdropsTab = false)
                findNavController().navigate(action)
            }
        )

        binding.rvMovies.apply {
            layoutManager = GridLayoutManager(requireContext(), 3)
            adapter = this@ComingSoonFragment.adapter
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
                ScrollStateHelper.restore(binding.rvMovies, savedScrollState)
                savedScrollState = null
            }
        }

        viewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility =
                if (isLoading && !binding.swipeRefresh.isRefreshing) View.VISIBLE else View.GONE
            if (!isLoading) binding.swipeRefresh.isRefreshing = false
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let { showSnackbar(it, SnackbarType.ERROR) }
        }

        viewModel.loadMovies()
    }

    override fun onRefresh() { viewModel.loadMovies() }

    override fun onStop() {
        super.onStop()
        savedScrollState = ScrollStateHelper.save(binding.rvMovies)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
