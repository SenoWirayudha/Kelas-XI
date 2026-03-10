package com.komputerkit.moview.ui.filmlist

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.FragmentFilmListBinding
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.applyCustomMedia
import kotlinx.coroutines.launch

class FilmListFragment : Fragment() {

    private var _binding: FragmentFilmListBinding? = null
    private val binding get() = _binding!!
    private val args: FilmListFragmentArgs by navArgs()

    private lateinit var adapter: FilmGridAdapter
    private val repository = MovieRepository()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFilmListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupToolbar()
        setupRecyclerView()
        loadFilms()
    }

    override fun onResume() {
        super.onResume()
        loadFilms()
    }

    private fun setupToolbar() {
        binding.tvTitle.text = args.categoryName
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }

    private fun setupRecyclerView() {
        adapter = FilmGridAdapter(
            onMovieClick = { movie ->
                val action = FilmListFragmentDirections.actionFilmListToMovieDetail(movie.id)
                findNavController().navigate(action)
            },
            onLogFilm = { movie ->
                val action = FilmListFragmentDirections.actionFilmListToLogFilm(movie.id)
                findNavController().navigate(action)
            },
            onChangePoster = { movie ->
                val action = FilmListFragmentDirections.actionFilmListToPosterBackdrop(movie.id, false)
                findNavController().navigate(action)
            }
        )
        binding.rvFilms.apply {
            layoutManager = GridLayoutManager(requireContext(), 4)
            adapter = this@FilmListFragment.adapter
        }
    }

    private fun loadFilms() {
        binding.progressBar.visibility = View.VISIBLE
        binding.tvEmpty.visibility = View.GONE

        val userId = requireContext()
            .getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
            .getInt("userId", 0)

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val rawFilms = repository.getFilmsByCategory(args.categoryType, args.categoryValue)

                val films = if (userId > 0 && rawFilms.isNotEmpty()) {
                    val customMedia = repository.batchCustomMedia(userId, rawFilms.map { it.id }, "films")
                    rawFilms.applyCustomMedia(customMedia)
                } else {
                    rawFilms
                }

                binding.progressBar.visibility = View.GONE
                if (films.isEmpty()) {
                    binding.tvEmpty.visibility = View.VISIBLE
                    binding.tvEmpty.text = "No films found for ${args.categoryName}"
                } else {
                    adapter.submitList(films)
                }
            } catch (e: Exception) {
                binding.progressBar.visibility = View.GONE
                binding.tvEmpty.visibility = View.VISIBLE
                binding.tvEmpty.text = "Failed to load films. Please try again."
                e.printStackTrace()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
