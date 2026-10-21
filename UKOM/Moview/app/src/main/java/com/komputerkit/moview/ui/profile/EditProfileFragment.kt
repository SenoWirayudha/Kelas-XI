package com.komputerkit.moview.ui.profile

import android.content.Context
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
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.util.loadProfilePhoto
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentEditProfileBinding
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.applyInterButtons
import com.komputerkit.moview.util.TmdbImageUrl
import com.yalantis.ucrop.UCrop
import kotlinx.coroutines.launch

class EditProfileFragment : Fragment() {

    private var _binding: FragmentEditProfileBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: EditProfileViewModel by viewModels()
    private lateinit var favoriteSlotAdapter: FavoriteSlotAdapter
    
    private var hasFavorites = false
    private var isBackdropEnabled = false
    private var currentBackdropUrl: String? = null
    private var skipPhotoReload = false // Flag to prevent reload after upload
    
    // Photo picker launcher - opens cropper
    private val pickImageLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            startCropActivity(it)
        }
    }
    
    // Crop result launcher
    private val cropImageLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val resultUri = result.data?.let { UCrop.getOutput(it) }
            resultUri?.let { croppedUri ->
                // Set flag to prevent reload
                skipPhotoReload = true
                
                // Upload cropped photo
                viewModel.uploadProfilePhoto(croppedUri)
                
                // Update UI immediately with cropped image
                binding.ivProfile.loadProfilePhoto(croppedUri.toString())
                
                // Save URI to SharedPreferences immediately for consistency
                val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
                prefs.edit().putString("tempProfilePhotoUri", croppedUri.toString()).apply()
            }
        }
    }

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
        setupUsernameCounter()
        setupBottomBarScrollPadding()
    }

    /**
     * Reserve the fixed bottom bar's height as scroll padding (with
     * clipToPadding=false in XML) so the last section — the backdrop toggle —
     * can scroll fully clear of the Save Changes bar. Kept in sync when the
     * keyboard resizes the window.
     */
    private fun setupBottomBarScrollPadding() {
        val applyPadding = {
            if (_binding != null) {
                binding.scrollContent.setPadding(
                    binding.scrollContent.paddingLeft,
                    0,
                    binding.scrollContent.paddingRight,
                    binding.layoutBottomBar.height
                )
            }
        }
        binding.layoutBottomBar.post(applyPadding)
        binding.layoutBottomBar.addOnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
            if (top != oldTop || bottom != oldBottom) applyPadding()
        }
    }

    private fun setupUsernameCounter() {
        binding.tvUsernameCounter.text = "${binding.etUsername.text.length}/20"
        binding.etUsername.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                val len = s?.length ?: 0
                binding.tvUsernameCounter.text = "$len/20"
                binding.tvUsernameCounter.setTextColor(
                    if (len == 20)
                        android.graphics.Color.parseColor("#FF5252")
                    else
                        requireContext().getColor(R.color.text_secondary)
                )
            }
        })
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
            // 4 equal-width slots in a single non-scrollable row.
            layoutManager = GridLayoutManager(requireContext(), 4)
            adapter = favoriteSlotAdapter
            isNestedScrollingEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            addItemDecoration(SlotSpacingDecoration((6 * resources.displayMetrics.density).toInt()))
        }

        attachDragToReorder()
        applySlotHeightsFromWidth()
    }

    /**
     * Derives each slot's height from its measured cell width (2:3) once the
     * RecyclerView has a real width. A 0dp+ratio item collapses to 0 height
     * under GridLayoutManager's unspecified vertical measure pass, so the
     * height must be pinned here after layout instead.
     */
    private fun applySlotHeightsFromWidth() {
        val spacing = (6 * resources.displayMetrics.density).toInt()
        val compute = {
            if (_binding != null) {
                val rvWidth = binding.rvFavorites.width
                if (rvWidth > 0) {
                    val cellWidth = rvWidth / 4
                    val itemWidth = cellWidth - spacing // minus left+right decoration
                    val height = (itemWidth * 3f / 2f).toInt()
                    if (height > 0 && favoriteSlotAdapter.itemHeight != height) {
                        favoriteSlotAdapter.itemHeight = height
                        favoriteSlotAdapter.notifyDataSetChanged()
                    }
                }
            }
        }
        binding.rvFavorites.post(compute)
        // Re-derive if the available width changes (e.g. rotation).
        binding.rvFavorites.addOnLayoutChangeListener { _, left, _, right, _, oldLeft, _, oldRight, _ ->
            if (left != oldLeft || right != oldRight) compute()
        }
    }

    /** Long-press + drag to reorder the filled slots; empty "+" slots never move. */
    private fun attachDragToReorder() {
        val callback = object : ItemTouchHelper.SimpleCallback(
            ItemTouchHelper.LEFT or ItemTouchHelper.RIGHT, 0
        ) {
            override fun getMovementFlags(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder
            ): Int {
                // Only slots holding a movie can be dragged.
                val position = viewHolder.bindingAdapterPosition
                val isMovie = favoriteSlotAdapter.itemAt(position)?.movie != null
                return if (isMovie) {
                    makeMovementFlags(ItemTouchHelper.LEFT or ItemTouchHelper.RIGHT, 0)
                } else {
                    0
                }
            }

            override fun onMove(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder,
                target: RecyclerView.ViewHolder
            ): Boolean {
                val moved = favoriteSlotAdapter.onItemMove(
                    viewHolder.bindingAdapterPosition,
                    target.bindingAdapterPosition
                )
                // Update the rank badges live while dragging.
                if (moved) favoriteSlotAdapter.refreshRanks(recyclerView)
                return moved
            }

            // Swipe is disabled (0 dirs); required abstract no-op.
            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {}

            override fun onSelectedChanged(viewHolder: RecyclerView.ViewHolder?, actionState: Int) {
                super.onSelectedChanged(viewHolder, actionState)
                if (actionState == ItemTouchHelper.ACTION_STATE_DRAG && viewHolder != null) {
                    // Short haptic + slight lift/enlarge for the dragged slot.
                    viewHolder.itemView.performHapticFeedback(
                        android.view.HapticFeedbackConstants.LONG_PRESS
                    )
                    viewHolder.itemView.animate().scaleX(1.06f).scaleY(1.06f).setDuration(120).start()
                    viewHolder.itemView.elevation = 8f * resources.displayMetrics.density
                }
            }

            override fun clearView(recyclerView: RecyclerView, viewHolder: RecyclerView.ViewHolder) {
                super.clearView(recyclerView, viewHolder)
                viewHolder.itemView.animate().scaleX(1f).scaleY(1f).setDuration(120).start()
                viewHolder.itemView.elevation = 0f
                // Commit the new order (persisted when Save Changes is pressed).
                viewModel.setFavoriteOrder(favoriteSlotAdapter.currentItems())
            }

            override fun isItemViewSwipeEnabled(): Boolean = false
        }
        ItemTouchHelper(callback).attachToRecyclerView(binding.rvFavorites)
    }

    /** Even horizontal gap between the 4 slots (and at the outer edges). */
    private class SlotSpacingDecoration(private val spacing: Int) : RecyclerView.ItemDecoration() {
        override fun getItemOffsets(
            outRect: android.graphics.Rect,
            view: View,
            parent: RecyclerView,
            state: RecyclerView.State
        ) {
            outRect.left = spacing / 2
            outRect.right = spacing / 2
        }
    }
    
    private fun setupObservers() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                // Update UI
                binding.etUsername.setText(state.username)
                binding.etBio.setText(state.bio)
                binding.etLocation.setText(state.location)
                
                // Update profile photo from state (only if not skipping reload)
                if (!skipPhotoReload && !state.profilePhotoUrl.isNullOrBlank()) {
                    binding.ivProfile.loadProfilePhoto(state.profilePhotoUrl)
                }
                
                // Update backdrop enabled state
                isBackdropEnabled = state.backdropEnabled
                binding.switchBackdrop.isChecked = state.backdropEnabled
                
                // Update backdrop URL from state
                currentBackdropUrl = state.backdropUrl
                
                // Update favorites
                favoriteSlotAdapter.submitList(state.favoriteSlots)
                
                // Check if has favorites for backdrop toggle
                hasFavorites = state.favoriteSlots.any { it.movie != null }
                
                updateToggleState()
                updateBackdrop()
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
            
            // Listen for selected backdrop from Poster & Backdrop screen
            savedStateHandle.getLiveData<String>("selected_backdrop_path").observe(viewLifecycleOwner) { backdropPath ->
                if (!backdropPath.isNullOrBlank()) {
                    // Update backdrop in database
                    viewModel.updateBackdrop(backdropPath)
                    
                    // Clear saved state
                    savedStateHandle.remove<String>("selected_backdrop_path")
                    
                    // Show success message
                    showSnackbar("Backdrop updated successfully", SnackbarType.SUCCESS)
                }
            }
        }
    }

    private fun loadProfileData() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                // Only load if fragment is still attached
                if (!isAdded) return@collect
                
                // Skip photo reload if we just uploaded a new photo
                if (skipPhotoReload) return@collect
                
                // Load profile photo from SharedPreferences or API
                val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
                val profilePhotoUrl = prefs.getString("profilePhotoUrl", null)
                
                // Use same loading strategy as poster/backdrop for reliability
                binding.ivProfile.loadProfilePhoto(profilePhotoUrl)
            }
        }
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
                if (hasFavorites) {
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
                viewModel.updateBackdropEnabled(isChecked)
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
        if (isBackdropEnabled && !currentBackdropUrl.isNullOrEmpty()) {
            // Toggle ON: Show backdrop (clear/sharp)
            binding.ivBackdrop.visibility = View.VISIBLE
            Glide.with(requireContext())
                .load(com.komputerkit.moview.util.ServerConfig.fixUrl(currentBackdropUrl!!))
                .into(binding.ivBackdrop)
        } else {
            // Toggle OFF: Hide backdrop completely
            binding.ivBackdrop.visibility = View.GONE
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
            performLogout()
        }
        
        // Photo picker - click on profile image or camera icon
        binding.ivProfile.setOnClickListener {
            showPhotoOptionsDialog()
        }
        
        // Set to default - click on text below profile photo
        binding.tvSetDefault.setOnClickListener {
            setDefaultProfilePhoto()
        }
    }
    
    private fun showPhotoOptionsDialog() {
        val options = arrayOf("Select from gallery", "Set to default")
        
        android.app.AlertDialog.Builder(requireContext())
            .setTitle("Profile Photo")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> pickImageLauncher.launch("image/*")
                    1 -> setDefaultProfilePhoto()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
            .applyInterButtons()
    }
    
    private fun setDefaultProfilePhoto() {
        // Call ViewModel to delete profile photo via API
        viewModel.setDefaultProfilePhoto()
        
        // Update UI immediately with default photo
        binding.ivProfile.setImageResource(R.drawable.ic_default_profile)
        
        // Show confirmation
        showSnackbar("Profile photo reset to default", SnackbarType.SUCCESS)
    }
    
    private fun startCropActivity(sourceUri: android.net.Uri) {
        val destinationUri = android.net.Uri.fromFile(
            java.io.File(requireContext().cacheDir, "cropped_profile_${System.currentTimeMillis()}.jpg")
        )
        
        val options = UCrop.Options().apply {
            setCompressionQuality(90)
            setCircleDimmedLayer(true) // Circular crop overlay
            setShowCropFrame(false)
            setShowCropGrid(false)
            setStatusBarColor(android.graphics.Color.parseColor("#14181C"))
            setToolbarColor(android.graphics.Color.parseColor("#14181C"))
            setToolbarWidgetColor(android.graphics.Color.WHITE)
            setActiveControlsWidgetColor(android.graphics.Color.parseColor("#00E0FF"))
            setToolbarTitle("Crop Profile Photo")
        }
        
        val uCrop = UCrop.of(sourceUri, destinationUri)
            .withAspectRatio(1f, 1f) // Square crop for profile photo
            .withMaxResultSize(1080, 1080)
            .withOptions(options)
        
        cropImageLauncher.launch(uCrop.getIntent(requireContext()))
    }

    private fun navigateToBackdropSelection() {
        // Get first favorite movie ID
        val firstFavoriteMovie = viewModel.uiState.value.favoriteSlots.firstOrNull { it.movie != null }?.movie
        
        if (firstFavoriteMovie != null) {
            // Navigate to Poster & Backdrop screen with actual movie ID
            val action = EditProfileFragmentDirections.actionEditProfileToPosterBackdrop(
                movieId = firstFavoriteMovie.id,
                openBackdropsTab = true, // Opens in Backdrop mode
                contextType = "profile"
            )
            findNavController().navigate(action)
        } else {
            // No favorite movies yet
            showSnackbar("Tambahkan film favorit dulu", SnackbarType.ERROR)
        }
    }

    private fun saveChanges() {
        val username = binding.etUsername.text.toString()
        val bio = binding.etBio.text.toString()
        val location = binding.etLocation.text.toString()
        
        // Validate — errors surface via Snackbar (no inline error icons)
        if (username.isEmpty()) {
            showSnackbar("Username wajib diisi", SnackbarType.ERROR)
            return
        }
        if (username.length > 20) {
            showSnackbar("Username maksimal 20 karakter", SnackbarType.ERROR)
            return
        }
        
        // Update ViewModel
        viewModel.updateUsername(username)
        viewModel.updateBio(bio)
        viewModel.updateLocation(location)
        
        // Save to API
        lifecycleScope.launch {
            // Wait if photo is still uploading
            if (viewModel.uiState.value.isLoading) {
                showSnackbar("Tunggu, foto masih diunggah...", SnackbarType.INFO)
                return@launch
            }
            
            val success = viewModel.saveProfile()
            if (success) {
                if (isAdded) {
                    // Get the latest profile photo URL from ViewModel state (more reliable)
                    val profilePhotoUrl = viewModel.uiState.value.profilePhotoUrl
                    
                    android.util.Log.d("EditProfileFragment", "Sending profile_photo_url: $profilePhotoUrl")
                    
                    // Set result to notify ProfileFragment to reload
                    findNavController().previousBackStackEntry?.savedStateHandle?.set("profile_updated", true)
                    findNavController().previousBackStackEntry?.savedStateHandle?.set("profile_photo_url", profilePhotoUrl)
                    
                    // Show success message
                    showSnackbar("Profile updated successfully", SnackbarType.SUCCESS)
                    
                    findNavController().navigateUp()
                }
            } else {
                // Show error toast - safely access context
                context?.let { ctx ->
                    showSnackbar("Gagal menyimpan profil. Coba lagi.", SnackbarType.ERROR)
                }
            }
        }
    }
    
    private fun performLogout() {
        // Only proceed if fragment is still attached
        if (!isAdded) return
        
        // Clear login state
        val sharedPrefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        sharedPrefs.edit().apply {
            putBoolean("isLoggedIn", false)
            remove("userEmail")
            remove("username")
            remove("authToken")
            remove("userId")
            apply()
        }
        // Clear any in-flight OTP verification state.
        com.komputerkit.moview.ui.auth.OtpStateStore.clear(requireContext())
        
        // Navigate to login and clear the ENTIRE back stack so the hardware
        // back button exits the app instead of returning to the logged-out session.
        val navController = findNavController()
        val navOptions = androidx.navigation.NavOptions.Builder()
            .setPopUpTo(navController.graph.startDestinationId, true)
            .build()
        navController.navigate(R.id.loginFragment, null, navOptions)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
