package com.komputerkit.moview.ui.profile

import android.content.res.ColorStateList
import android.graphics.Typeface
import android.os.Bundle
import android.text.Spannable
import android.text.SpannableString
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentEditProfileBinding
import com.komputerkit.moview.util.TmdbImageUrl
import kotlinx.coroutines.launch

class EditProfileFragment : Fragment() {

    private var _binding: FragmentEditProfileBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: EditProfileViewModel by viewModels()
    private lateinit var favoriteSlotAdapter: FavoriteSlotAdapter
    
    private var hasFavorites = false
    private var isBackdropEnabled = false
    private var firstFavoriteBackdropUrl: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEditProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        loadProfileData()
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
        setupBackdropToggle()
        setupNavigationResultListener()
    }
    
    private fun setupRecyclerView() {
        favoriteSlotAdapter = FavoriteSlotAdapter(
            onAddClick = { index ->
                // Navigate to Search Screen in SELECT_MOVIE_MODE
                val action = EditProfileFragmentDirections.actionEditProfileToSearch(
                    selectMovieMode = true,
                    slotIndex = index
                )
                findNavController().navigate(action)
            },
            onRemoveClick = { index ->
                viewModel.removeFavoriteMovie(index)
            }
        )
        
        binding.rvFavorites.apply {
            adapter = favoriteSlotAdapter
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        }
    }
    
    private fun setupObservers() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                // Update UI
                binding.etUsername.setText(state.username)
                binding.etBio.setText(state.bio)
                
                // Update favorites
                favoriteSlotAdapter.submitList(state.favoriteSlots)
                
                // Check if has favorites for backdrop toggle
                hasFavorites = state.favoriteSlots.any { it.movie != null }
                if (hasFavorites) {
                    firstFavoriteBackdropUrl = state.favoriteSlots.firstOrNull { it.movie != null }?.movie?.backdropUrl
                }
                updateToggleState()
            }
        }
    }
    
    private fun setupNavigationResultListener() {
        // Listen for selected movie from Search Screen
        findNavController().currentBackStackEntry?.savedStateHandle?.let { savedStateHandle ->
            savedStateHandle.getLiveData<Int>("selected_movie_id").observe(viewLifecycleOwner) { movieId ->
                savedStateHandle.getLiveData<Int>("slot_index").observe(viewLifecycleOwner) { slotIndex ->
                    if (movieId != null && slotIndex != null) {
                        // Get full movie from ViewModel and add to favorites
                        viewModel.addFavoriteMovieById(slotIndex, movieId)
                        // Clear saved state
                        savedStateHandle.remove<Int>("selected_movie_id")
                        savedStateHandle.remove<Int>("slot_index")
                    }
                }
            }
        }
    }

    private fun loadProfileData() {
        // Load profile photo - circular avatar
        Glide.with(this)
            .load("https://i.pravatar.cc/150?img=1")
            .circleCrop()
            .into(binding.ivProfile)
        
        // Load default backdrop with blur (toggle OFF state)
        val defaultBackdrop = TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT)
        Glide.with(this)
            .load(defaultBackdrop)
            .transform(jp.wasabeef.glide.transformations.BlurTransformation(25, 3))
            .into(binding.ivBackdrop)
    }

    private fun loadFavorites() {
        // Handled by ViewModel and StateFlow
    }
    
    private fun updateToggleState() {
        if (hasFavorites) {
            binding.layoutBackdropToggle.visibility = View.VISIBLE
            binding.switchBackdrop.isEnabled = true
            binding.tvBackdropLabel.alpha = 1.0f
        } else {
            binding.layoutBackdropToggle.visibility = View.VISIBLE
            binding.switchBackdrop.isEnabled = false
            binding.switchBackdrop.isChecked = false
            binding.tvBackdropLabel.alpha = 0.5f
        }
        updateToggleColors()
    }

    private fun setupBackdropToggle() {
        // Make only "film favorit pertama" clickable in the label
        val fullText = "Aktifkan backdrop, gunakan backdrop dari film favorit pertama"
        val clickableText = "film favorit pertama"
        val startIndex = fullText.indexOf(clickableText)
        val endIndex = startIndex + clickableText.length
        
        val spannableString = SpannableString(fullText)
        
        val clickableSpan = object : ClickableSpan() {
            override fun onClick(widget: View) {
                // Only allow navigation if hasFavorites is true
                if (hasFavorites && firstFavoriteBackdropUrl != null) {
                    navigateToBackdropSelection()
                }
            }
            
            override fun updateDrawState(ds: android.text.TextPaint) {
                super.updateDrawState(ds)
                ds.isUnderlineText = false
            }
        }
        
        spannableString.setSpan(
            clickableSpan,
            startIndex,
            endIndex,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        )
        
        spannableString.setSpan(
            ForegroundColorSpan(ContextCompat.getColor(requireContext(), R.color.accent_blue)),
            startIndex,
            endIndex,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        )
        
        spannableString.setSpan(
            StyleSpan(Typeface.BOLD),
            startIndex,
            endIndex,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        )
        
        binding.tvBackdropLabel.text = spannableString
        binding.tvBackdropLabel.movementMethod = LinkMovementMethod.getInstance()
        
        // Toggle behavior - only enabled when hasFavorites is true
        binding.switchBackdrop.setOnCheckedChangeListener { _, isChecked ->
            if (hasFavorites) {
                isBackdropEnabled = isChecked
                updateBackdrop()
                updateToggleColors()
            }
        }
    }

    private fun updateToggleColors() {
        // Derive visual state from isBackdropEnabled and hasFavorites
        val context = requireContext()
        
        when {
            !hasFavorites -> {
                // DISABLED state: muted gray track, muted thumb, reduced opacity
                binding.switchBackdrop.thumbTintList = ColorStateList.valueOf(
                    ContextCompat.getColor(context, R.color.text_secondary)
                )
                binding.switchBackdrop.trackTintList = ColorStateList.valueOf(
                    ContextCompat.getColor(context, R.color.dark_card)
                )
                binding.switchBackdrop.alpha = 0.5f
            }
            isBackdropEnabled -> {
                // ON state: blue track, white thumb
                binding.switchBackdrop.thumbTintList = ColorStateList.valueOf(
                    ContextCompat.getColor(context, R.color.white)
                )
                binding.switchBackdrop.trackTintList = ColorStateList.valueOf(
                    ContextCompat.getColor(context, R.color.accent_blue)
                )
                binding.switchBackdrop.alpha = 1.0f
            }
            else -> {
                // OFF state: neutral gray track, darker neutral thumb
                binding.switchBackdrop.thumbTintList = ColorStateList.valueOf(
                    ContextCompat.getColor(context, R.color.text_secondary)
                )
                binding.switchBackdrop.trackTintList = ColorStateList.valueOf(
                    ContextCompat.getColor(context, R.color.dark_card)
                )
                binding.switchBackdrop.alpha = 1.0f
            }
        }
    }

    private fun updateBackdrop() {
        // Determine backdrop URL - ALWAYS have a valid fallback
        val backdropUrl = if (isBackdropEnabled && !firstFavoriteBackdropUrl.isNullOrEmpty()) {
            firstFavoriteBackdropUrl // Use first favorite backdrop when toggle ON and available
        } else {
            TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT) // Default backdrop
        }
        
        // CRITICAL: Always load backdrop image
        if (isBackdropEnabled) {
            // Toggle ON: Load WITHOUT blur (clear/sharp)
            Glide.with(requireContext())
                .load(backdropUrl)
                .into(binding.ivBackdrop)
        } else {
            // Toggle OFF: Load WITH blur
            Glide.with(requireContext())
                .load(backdropUrl)
                .transform(jp.wasabeef.glide.transformations.BlurTransformation(25, 3))
                .into(binding.ivBackdrop)
        }
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }

        binding.btnSave.setOnClickListener {
            saveChanges()
        }

        binding.btnLogout.setOnClickListener {
            // TODO: Implement logout
        }
        
        binding.tvEditFavorites.setOnClickListener {
            // TODO: Navigate to favorites management
        }
    }

    private fun navigateToBackdropSelection() {
        // Navigate to Poster & Backdrop screen
        // Open directly in Backdrop grid mode, poster selection disabled
        // Using movie ID 1 (Interstellar) as example - first favorite
        val action = EditProfileFragmentDirections.actionEditProfileToPosterBackdrop(
            movieId = 1,
            openBackdropsTab = true // Opens in Backdrop mode
        )
        findNavController().navigate(action)
    }

    private fun saveChanges() {
        val username = binding.etUsername.text.toString()
        val bio = binding.etBio.text.toString()
        
        // TODO: Save to repository
        // TODO: Save backdrop preference and URL
        
        findNavController().navigateUp()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
