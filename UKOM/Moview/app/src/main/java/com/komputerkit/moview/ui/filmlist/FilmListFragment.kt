package com.komputerkit.moview.ui.filmlist

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
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
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
    
    private fun setupToolbar() {
        binding.tvTitle.text = args.categoryName
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun setupRecyclerView() {
        adapter = FilmGridAdapter { movie ->
            val action = FilmListFragmentDirections.actionFilmListToMovieDetail(movie.id)
            findNavController().navigate(action)
        }
        
        binding.rvFilms.apply {
            layoutManager = GridLayoutManager(requireContext(), 4)
            adapter = this@FilmListFragment.adapter
        }
    }
    
    private fun loadFilms() {
        binding.progressBar.visibility = View.VISIBLE
        binding.tvEmpty.visibility = View.GONE
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val films = repository.getFilmsByCategory(
                    args.categoryType,
                    args.categoryValue
                )
                
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
