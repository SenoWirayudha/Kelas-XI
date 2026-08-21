package com.komputerkit.moview.ui.artwork

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.ArtworkType
import com.komputerkit.moview.databinding.FragmentPosterBackdropBinding
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType

class PosterBackdropFragment : Fragment() {

    private var _binding: FragmentPosterBackdropBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: PosterBackdropViewModel by viewModels()
    private val args: PosterBackdropFragmentArgs by navArgs()
    
    private lateinit var posterAdapter: PosterArtworkAdapter
    private lateinit var backdropAdapter: BackdropArtworkAdapter
    
    private var currentTab = ArtworkType.POSTER

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPosterBackdropBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewModel.loadMovie(
            movieId = args.movieId,
            contextType = args.contextType,
            favoriteId = args.favoriteId.takeIf { it > 0 },
            diariesId = args.diariesId.takeIf { it > 0 }
        )
        
        setupRecyclerViews()
        setupClickListeners()
        setupObservers()
        
        // If openBackdropsTab argument is true, switch to backdrops tab
        if (args.openBackdropsTab) {
            switchToTab(ArtworkType.BACKDROP)
        }
    }
    
    private fun setupRecyclerViews() {
        // Posters grid (3 columns)
        posterAdapter = PosterArtworkAdapter { artwork ->
            viewModel.selectArtwork(artwork)
        }
        
        binding.rvPosters.layoutManager = GridLayoutManager(requireContext(), 3)
        binding.rvPosters.adapter = posterAdapter
        
        // Backdrops list (1 column)
        backdropAdapter = BackdropArtworkAdapter { artwork ->
            viewModel.selectArtwork(artwork)
        }
        
        binding.rvBackdrops.layoutManager = LinearLayoutManager(requireContext())
        binding.rvBackdrops.adapter = backdropAdapter
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.btnPosters.setOnClickListener {
            switchToTab(ArtworkType.POSTER)
        }
        
        binding.btnBackdrops.setOnClickListener {
            switchToTab(ArtworkType.BACKDROP)
        }
        
        binding.btnSetCover.setOnClickListener {
            saveCover()
        }
    }
    
    private fun setupObservers() {
        viewModel.movie.observe(viewLifecycleOwner) { movie ->
            binding.tvMovieTitle.text = "${movie.title} (${movie.releaseYear})"
        }
        
        viewModel.posters.observe(viewLifecycleOwner) { posters ->
            posterAdapter.submitList(posters)
            updateEmptyState()
        }
        
        viewModel.backdrops.observe(viewLifecycleOwner) { backdrops ->
            backdropAdapter.submitList(backdrops)
            updateEmptyState()
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.saveResult.observe(viewLifecycleOwner) { success ->
            if (success == null) return@observe
            viewModel.clearSaveResult()
            if (success) {
                val selectedBackdropPath = viewModel.selectedArtwork.value?.url
                if (selectedBackdropPath != null && currentTab == ArtworkType.BACKDROP) {
                    findNavController().previousBackStackEntry?.savedStateHandle?.set(
                        "selected_backdrop_path",
                        selectedBackdropPath
                    )
                }
                // Signal all previous screens to refresh their artwork
                findNavController().previousBackStackEntry?.savedStateHandle?.set(
                    "artwork_saved", true
                )
                showSnackbar("Artwork saved successfully!", SnackbarType.SUCCESS)
                findNavController().navigateUp()
            } else {
                showSnackbar("Failed to save artwork", SnackbarType.ERROR)
            }
        }
    }
    
    private fun updateEmptyState() {
        val currentList = if (currentTab == ArtworkType.POSTER) {
            viewModel.posters.value
        } else {
            viewModel.backdrops.value
        }
        val isEmpty = currentList.isNullOrEmpty()
        binding.tvEmpty.visibility = if (isEmpty) View.VISIBLE else View.GONE
        if (currentTab == ArtworkType.POSTER) {
            binding.rvPosters.visibility = if (isEmpty) View.GONE else View.VISIBLE
        } else {
            binding.rvBackdrops.visibility = if (isEmpty) View.GONE else View.VISIBLE
        }
    }

    private fun switchToTab(type: ArtworkType) {
        currentTab = type
        updateEmptyState()
        
        when (type) {
            ArtworkType.POSTER -> {
                binding.rvPosters.visibility = View.VISIBLE
                binding.rvBackdrops.visibility = View.GONE
                
                binding.btnPosters.backgroundTintList = ContextCompat.getColorStateList(
                    requireContext(),
                    R.color.accent_blue
                )
                binding.btnPosters.setTextColor(
                    ContextCompat.getColor(requireContext(), R.color.white)
                )
                
                binding.btnBackdrops.backgroundTintList = ContextCompat.getColorStateList(
                    requireContext(),
                    R.color.dark_card
                )
                binding.btnBackdrops.setTextColor(
                    ContextCompat.getColor(requireContext(), R.color.text_secondary)
                )
            }
            ArtworkType.BACKDROP -> {
                binding.rvPosters.visibility = View.GONE
                binding.rvBackdrops.visibility = View.VISIBLE
                
                binding.btnBackdrops.backgroundTintList = ContextCompat.getColorStateList(
                    requireContext(),
                    R.color.accent_blue
                )
                binding.btnBackdrops.setTextColor(
                    ContextCompat.getColor(requireContext(), R.color.white)
                )
                
                binding.btnPosters.backgroundTintList = ContextCompat.getColorStateList(
                    requireContext(),
                    R.color.dark_card
                )
                binding.btnPosters.setTextColor(
                    ContextCompat.getColor(requireContext(), R.color.text_secondary)
                )
            }
        }
    }
    
    private fun saveCover() {
        val favoriteId = args.favoriteId.takeIf { it > 0 }
        val diariesId = args.diariesId.takeIf { it > 0 }
        viewModel.saveArtwork(movieId = args.movieId, type = args.contextType, favoriteId = favoriteId, diariesId = diariesId)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
