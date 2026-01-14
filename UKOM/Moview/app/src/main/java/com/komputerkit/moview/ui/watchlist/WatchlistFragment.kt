package com.komputerkit.moview.ui.watchlist

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.chip.Chip
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.WatchlistItem
import com.komputerkit.moview.databinding.FragmentWatchlistBinding

class WatchlistFragment : Fragment() {

    private var _binding: FragmentWatchlistBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: WatchlistViewModel by viewModels()
    private lateinit var adapter: WatchlistAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWatchlistBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupChips()
        setupClickListeners()
        observeViewModel()
    }
    
    private fun setupRecyclerView() {
        adapter = WatchlistAdapter(
            onItemClick = { item ->
                navigateToMovieDetail(item)
            },
            onItemLongClick = { item ->
                // TODO: Show bottom sheet action panel
                Toast.makeText(requireContext(), "Long press on ${item.movie.title}", Toast.LENGTH_SHORT).show()
            }
        )
        
        binding.rvWatchlist.layoutManager = GridLayoutManager(requireContext(), 4)
        binding.rvWatchlist.adapter = adapter
    }
    
    private fun setupChips() {
        binding.chipAllMovies.isChecked = true
        
        binding.chipAllMovies.setOnClickListener {
            updateChipSelection(it as Chip)
            viewModel.filterAllMovies()
        }
        
        binding.chipDateAdded.setOnClickListener {
            updateChipSelection(it as Chip)
            viewModel.filterByDateAdded()
        }
        
        binding.chipUnwatched.setOnClickListener {
            updateChipSelection(it as Chip)
            viewModel.filterUnwatched()
        }
    }
    
    private fun updateChipSelection(selectedChip: Chip) {
        binding.chipAllMovies.isChecked = selectedChip.id == R.id.chip_all_movies
        binding.chipDateAdded.isChecked = selectedChip.id == R.id.chip_date_added
        binding.chipUnwatched.isChecked = selectedChip.id == R.id.chip_unwatched
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun observeViewModel() {
        viewModel.watchlistItems.observe(viewLifecycleOwner) { items ->
            adapter.submitList(items)
        }
    }
    
    private fun navigateToMovieDetail(item: WatchlistItem) {
        val action = WatchlistFragmentDirections.actionWatchlistToMovieDetail(item.movie.id)
        findNavController().navigate(action)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
