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
import androidx.navigation.fragment.findNavController
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentEditProfileBinding
import com.komputerkit.moview.util.TmdbImageUrl

class EditProfileFragment : Fragment() {

    private var _binding: FragmentEditProfileBinding? = null
    private val binding get() = _binding!!
    
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
        setupClickListeners()
        setupBackdropToggle()
    }

    private fun loadProfileData() {
        // Load user profile data
        binding.etUsername.setText("moviebuff_99")
        binding.etBio.setText("Cinema lover. Sci-fi enthusiast. Always waiting for the next Christopher Nolan masterpiece.")
        
        // Load profile photo - circular avatar
        Glide.with(this)
            .load("https://i.pravatar.cc/150?img=1")
            .circleCrop()
            .into(binding.ivProfile)
        
        // Load backdrop - default or from favorite
        val defaultBackdrop = TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT)
        Glide.with(this)
            .load(defaultBackdrop)
            .into(binding.ivBackdrop)
        
        // Load Top 4 Favorites
        loadFavorites()
    }

    private fun loadFavorites() {
        // Sample favorite movies - in real app, load from repository
        val favorites = listOf(
            TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR),
            TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNE),
            TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT)
        )
        
        if (favorites.isNotEmpty()) {
            hasFavorites = true
            Glide.with(this).load(favorites[0]).into(binding.ivFavorite1)
            firstFavoriteBackdropUrl = TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_INTERSTELLAR)
            
            binding.layoutBackdropToggle.visibility = View.VISIBLE
            binding.switchBackdrop.isEnabled = true
            binding.tvBackdropLabel.alpha = 1.0f
            updateToggleColors()
        } else {
            hasFavorites = false
            binding.layoutBackdropToggle.visibility = View.VISIBLE
            binding.switchBackdrop.isEnabled = false
            binding.switchBackdrop.isChecked = false
            binding.tvBackdropLabel.alpha = 0.5f
            updateToggleColors()
        }
        
        if (favorites.size > 1) {
            Glide.with(this).load(favorites[1]).into(binding.ivFavorite2)
        }
        
        if (favorites.size > 2) {
            Glide.with(this).load(favorites[2]).into(binding.ivFavorite3)
        }
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
        // Stable and deterministic: favorites[0] is the ONLY backdrop source when enabled
        val backdropUrl = if (isBackdropEnabled && firstFavoriteBackdropUrl != null) {
            firstFavoriteBackdropUrl // Always use favorites[0] when ON
        } else {
            TmdbImageUrl.getBackdropUrl(TmdbImageUrl.Sample.BACKDROP_DEFAULT) // Default when OFF
        }
        
        Glide.with(this)
            .load(backdropUrl)
            .into(binding.ivBackdrop)
    }

    private fun setupClickListeners() {
        binding.btnClose.setOnClickListener {
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
