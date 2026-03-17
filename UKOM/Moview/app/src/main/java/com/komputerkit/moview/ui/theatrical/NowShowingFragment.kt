package com.komputerkit.moview.ui.theatrical

import android.content.Intent
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
import com.komputerkit.moview.databinding.FragmentNowShowingBinding
import com.komputerkit.moview.ui.cinema.MovieScheduleActivity
import com.komputerkit.moview.ui.home.TheatricalMovieAdapter
import com.komputerkit.moview.ui.social.GridSpacingItemDecoration

class NowShowingFragment : Fragment(), SwipeRefreshLayout.OnRefreshListener {

    private var _binding: FragmentNowShowingBinding? = null
    private val binding get() = _binding!!

    private val viewModel: NowShowingViewModel by viewModels()
    private lateinit var adapter: TheatricalMovieAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentNowShowingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        adapter = TheatricalMovieAdapter(
            onMovieClick = { movie ->
                val action = NowShowingFragmentDirections.actionNowShowingToMovieDetail(movieId = movie.id)
                findNavController().navigate(action)
            },
            onBuyTicketClick = { movie ->
                val intent = Intent(requireContext(), MovieScheduleActivity::class.java).apply {
                    putExtra(MovieScheduleActivity.EXTRA_MOVIE_ID, movie.id)
                    putExtra(MovieScheduleActivity.EXTRA_MOVIE_TITLE, movie.title)
                    putExtra(MovieScheduleActivity.EXTRA_POSTER_URL, movie.posterUrl ?: "")
                    putExtra(MovieScheduleActivity.EXTRA_BACKDROP_URL, "")
                    putExtra(MovieScheduleActivity.EXTRA_RATING, 0.0)
                    putExtra(MovieScheduleActivity.EXTRA_AGE_RATING, movie.ageRating ?: "SU")
                    putExtra(MovieScheduleActivity.EXTRA_GENRE, movie.genre ?: "")
                    putExtra(MovieScheduleActivity.EXTRA_DURATION, "")
                    putExtra(MovieScheduleActivity.EXTRA_DIRECTOR, "")
                }
                startActivity(intent)
            },
            gridMode = true,
            onLogFilm = { movie ->
                val action = NowShowingFragmentDirections.actionNowShowingToLogFilm(movieId = movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = NowShowingFragmentDirections.actionNowShowingToPosterBackdrop(movieId = movie.id, openBackdropsTab = false)
                findNavController().navigate(action)
            }
        )

        binding.rvMovies.apply {
            layoutManager = GridLayoutManager(requireContext(), 3)
            adapter = this@NowShowingFragment.adapter
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
