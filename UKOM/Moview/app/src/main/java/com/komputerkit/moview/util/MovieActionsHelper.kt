package com.komputerkit.moview.util

import android.app.Dialog
import android.content.Context
import android.content.ContextWrapper
import android.graphics.drawable.ColorDrawable
import android.util.Log
import android.view.GestureDetector
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.databinding.BottomSheetMovieActionsBinding
import com.komputerkit.moview.databinding.DialogFullPosterBinding
import kotlinx.coroutines.launch

/**
 * Helper class to show movie action bottom sheet from anywhere in the app.
 * Supports long press on poster to show actions.
 */
object MovieActionsHelper {

    private val repository = MovieRepository()
    
    /**
     * Get LifecycleOwner from Context by unwrapping ContextWrapper
     */
    private fun getLifecycleOwner(context: Context): LifecycleOwner? {
        var ctx = context
        while (ctx is ContextWrapper) {
            if (ctx is LifecycleOwner) {
                return ctx
            }
            ctx = ctx.baseContext
        }
        return null
    }

    /**
     * Shows the movie actions bottom sheet
     * @param context Context
     * @param movie Movie data
     * @param lifecycleOwner LifecycleOwner for coroutine scope (optional, will auto-detect from context)
     * @param isFromMovieDetail Set true if called from MovieDetailFragment to hide "Go to film" option
     * @param onGoToFilm Callback when "Go to film" is clicked (for navigation)
     * @param onLogFilm Callback when "Review or log" is clicked
     * @param onChangePoster Callback when "Change poster" is clicked
     * @param onRatingSaved Callback when rating is saved successfully (for refreshing data)
     */
    fun showMovieActionsBottomSheet(
        context: Context,
        movie: Movie,
        lifecycleOwner: LifecycleOwner? = null,
        isFromMovieDetail: Boolean = false,
        onGoToFilm: ((Movie) -> Unit)? = null,
        onLogFilm: ((Movie) -> Unit)? = null,
        onChangePoster: ((Movie) -> Unit)? = null,
        onRatingSaved: (() -> Unit)? = null,
        onWatchedTap: ((reviewId: Int, isLog: Boolean) -> Unit)? = null
    ) {
        val bottomSheetDialog = BottomSheetDialog(context)
        val binding = BottomSheetMovieActionsBinding.inflate(LayoutInflater.from(context))
        bottomSheetDialog.setContentView(binding.root)
        
        // Remove white background/border from bottom sheet
        bottomSheetDialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        // Set movie data
        binding.tvMovieTitle.text = movie.title
        binding.tvMovieYear.text = movie.releaseYear?.toString() ?: ""

        // Hide "Go to film" if already on movie detail page
        binding.btnGoToFilm.visibility = if (isFromMovieDetail) View.GONE else View.VISIBLE
        
        // Get user ID from SharedPreferences - use same name as Login
        val sharedPref = context.getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val userId = sharedPref.getInt("userId", 0)
        
        Log.d("MovieActionsHelper", "Retrieved userId from SharedPreferences: $userId")
        
        // Auto-detect LifecycleOwner from context if not provided
        val actualLifecycleOwner = lifecycleOwner ?: getLifecycleOwner(context)
        
        // Use local variable for current rating (not object-level to prevent state leak)
        var currentRating = 0
        var watchInfo: com.komputerkit.moview.data.api.WatchCountDto? = null
        var isWatchedState = false  // tracks current watched toggle state
        
        // Initialize stars to empty state
        val stars = listOf(
            binding.star1, binding.star2, binding.star3, binding.star4, binding.star5
        )
        
        // Load existing rating FIRST before setting default UI state
        if (userId > 0 && actualLifecycleOwner != null) {
            actualLifecycleOwner.lifecycleScope.launch {
                Log.d("MovieActionsHelper", "Loading rating for userId=$userId, movieId=${movie.id}")
                val ratingResponse = repository.getRating(userId, movie.id)
                Log.d("MovieActionsHelper", "getRating response: rating=${ratingResponse?.rating}, is_watched=${ratingResponse?.is_watched}")
                
                // Load like status
                val isLiked = repository.checkLike(userId, movie.id)
                
                // Load watchlist status
                val isInWatchlist = repository.checkWatchlist(userId, movie.id)
                
                // Load watch count (rewatch count)
                val watchInfoResult = repository.getWatchInfo(userId, movie.id)
                Log.d("MovieActionsHelper", "Watch info for movie ${movie.id}: $watchInfoResult")
                
                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                    // Store for use in click listener
                    watchInfo = watchInfoResult

                    // Load rating if exists
                    if (ratingResponse != null) {
                        currentRating = ratingResponse.rating ?: 0
                        updateStars(stars, currentRating)
                        Log.d("MovieActionsHelper", "Loaded rating: ${ratingResponse.rating} stars for movie ${movie.id}")
                    } else {
                        updateStars(stars, 0)
                        Log.d("MovieActionsHelper", "No rating found for movie ${movie.id}")
                    }
                    
                    // Icon watch state: from ratings table (is_watched), label from entry_type
                    val isWatched = ratingResponse?.is_watched ?: false
                    isWatchedState = isWatched
                    val entryType = watchInfoResult?.entry_type ?: "none"
                    updateWatchedButtonState(context, binding, isWatched, entryType)
                    Log.d("MovieActionsHelper", "Watch icon state: isWatched=$isWatched, entryType=$entryType")
                    
                    // Text "Review and log again": from diary entries count
                    val watchCount = watchInfoResult?.watch_count ?: 0
                    if (watchCount > 0) {
                        // User has logged this movie before - show "Review and log again"
                        binding.tvReviewLogText.text = "Review and log again"
                        Log.d("MovieActionsHelper", "Movie logged $watchCount time(s) - showing 'Review and log again'")
                    } else {
                        // First time logging this movie
                        binding.tvReviewLogText.text = "Review and log"
                        Log.d("MovieActionsHelper", "First time logging - showing 'Review and log'")
                    }
                    
                    // Show rewatch count (watch_count - 1) if user has rewatched at least once
                    val rewatchCount = watchInfoResult?.rewatch_count ?: 0
                    if (rewatchCount > 0) {
                        binding.layoutRewatch.visibility = View.VISIBLE
                        binding.tvRewatchCount.text = "Rewatch × $rewatchCount"
                    } else {
                        binding.layoutRewatch.visibility = View.GONE
                    }
                    
                    // Update like button state
                    val likeIcon = (binding.btnLike.getChildAt(0) as com.google.android.material.card.MaterialCardView)
                        .getChildAt(0) as ImageView
                    val likeText = binding.btnLike.getChildAt(1) as android.widget.TextView
                    
                    if (isLiked) {
                        likeIcon.setImageResource(R.drawable.ic_heart_filled)
                        likeIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                            context.getColor(R.color.red)
                        )
                        likeText.text = "Liked"
                    } else {
                        likeIcon.setImageResource(R.drawable.ic_heart)
                        likeIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                            context.getColor(R.color.text_secondary)
                        )
                        likeText.text = "Like"
                    }
                    
                    // Update watchlist button state
                    val watchlistIcon = (binding.btnWatchlist.getChildAt(0) as com.google.android.material.card.MaterialCardView)
                        .getChildAt(0) as ImageView
                    val watchlistText = binding.btnWatchlist.getChildAt(1) as android.widget.TextView
                    
                    if (isInWatchlist) {
                        watchlistIcon.setImageResource(R.drawable.ic_bookmark_filled)
                        watchlistIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                            context.getColor(R.color.orange)
                        )
                        watchlistText.text = "In Watchlist"
                    } else {
                        watchlistIcon.setImageResource(R.drawable.ic_bookmark)
                        watchlistIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                            context.getColor(R.color.text_secondary)
                        )
                        watchlistText.text = "Watchlist"
                    }
                }
            }
        } else {
            // No user logged in, set default state
            Log.w("MovieActionsHelper", "Cannot load rating: userId=$userId, lifecycleOwner=$actualLifecycleOwner")
            updateStars(stars, 0)
            updateWatchedButtonState(context, binding, false)
        }

        // Setup star rating (pass currentRating via closure)
        setupStarRating(context, binding, actualLifecycleOwner, movie, userId, onRatingSaved) { newRating ->
            currentRating = newRating
        }

        // Setup click listeners
        binding.btnWatched.setOnClickListener {
            if (userId > 0 && actualLifecycleOwner != null) {
                actualLifecycleOwner.lifecycleScope.launch {
                    if (isWatchedState) {
                        // Already watched → toggle OFF: delete from ratings
                        Log.d("MovieActionsHelper", "Unwatching: userId=$userId, movieId=${movie.id}")
                        val success = repository.deleteRating(userId, movie.id)
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                            if (success) {
                                isWatchedState = false
                                watchInfo = null
                                updateWatchedButtonState(context, binding, false, "none")
                                // Reset stars
                                currentRating = 0
                                updateStars(stars, 0)
                                binding.layoutRewatch.visibility = View.GONE
                                binding.tvReviewLogText.text = "Review and log"
                                Toast.makeText(context, "Removed from watched", Toast.LENGTH_SHORT).show()
                                onRatingSaved?.invoke()
                            } else {
                                Toast.makeText(context, "Failed to unwatch", Toast.LENGTH_SHORT).show()
                            }
                        }
                    } else {
                        // Not yet watched → mark as watched
                        val ratingValue = currentRating
                        Log.d("MovieActionsHelper", "Saving rating: userId=$userId, movieId=${movie.id}, rating=$ratingValue")
                        val success = repository.saveRating(userId, movie.id, ratingValue)
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                            if (success) {
                                isWatchedState = true
                                // Reload watch info to get updated entry_type
                                val updatedInfo = repository.getWatchInfo(userId, movie.id)
                                watchInfo = updatedInfo
                                updateWatchedButtonState(context, binding, true, updatedInfo?.entry_type ?: "none")
                                Toast.makeText(context, "Marked as watched", Toast.LENGTH_SHORT).show()
                                onRatingSaved?.invoke()
                            } else {
                                Toast.makeText(context, "Failed to save", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            } else {
                Log.e("MovieActionsHelper", "Cannot save: userId=$userId, lifecycleOwner=$actualLifecycleOwner")
                Toast.makeText(context, "Please login first", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnLike.setOnClickListener {
            if (userId > 0 && actualLifecycleOwner != null) {
                actualLifecycleOwner.lifecycleScope.launch {
                    val isLiked = repository.toggleLike(userId, movie.id)
                    
                    kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                        val likeIcon = (binding.btnLike.getChildAt(0) as com.google.android.material.card.MaterialCardView)
                            .getChildAt(0) as ImageView
                        val likeText = binding.btnLike.getChildAt(1) as android.widget.TextView
                        
                        when (isLiked) {
                            true -> {
                                // Now liked - just update UI, don't override rating
                                likeIcon.setImageResource(R.drawable.ic_heart_filled)
                                likeIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                                    context.getColor(R.color.red)
                                )
                                likeText.text = "Liked"
                                
                                // Don't auto-save rating - user should set rating separately
                                Toast.makeText(context, "Added to likes", Toast.LENGTH_SHORT).show()
                                
                                // Trigger callback to refresh data
                                onRatingSaved?.invoke()
                            }
                            false -> {
                                // Now unliked - keep watched status
                                likeIcon.setImageResource(R.drawable.ic_heart)
                                likeIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                                    context.getColor(R.color.text_secondary)
                                )
                                likeText.text = "Like"
                                Toast.makeText(context, "Removed from likes", Toast.LENGTH_SHORT).show()
                                
                                // Trigger callback to refresh data
                                onRatingSaved?.invoke()
                            }
                            null -> {
                                Toast.makeText(context, "Failed to update like", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            } else {
                Toast.makeText(context, "Please login first", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnWatchlist.setOnClickListener {
            if (userId > 0 && actualLifecycleOwner != null) {
                actualLifecycleOwner.lifecycleScope.launch {
                    val isInWatchlist = repository.toggleWatchlist(userId, movie.id)
                    
                    kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                        val watchlistIcon = (binding.btnWatchlist.getChildAt(0) as com.google.android.material.card.MaterialCardView)
                            .getChildAt(0) as ImageView
                        val watchlistText = binding.btnWatchlist.getChildAt(1) as android.widget.TextView
                        
                        when (isInWatchlist) {
                            true -> {
                                // Now in watchlist
                                watchlistIcon.setImageResource(R.drawable.ic_bookmark_filled)
                                watchlistIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                                    context.getColor(R.color.orange)
                                )
                                watchlistText.text = "In Watchlist"
                                Toast.makeText(context, "Added to watchlist", Toast.LENGTH_SHORT).show()
                            }
                            false -> {
                                // Removed from watchlist
                                watchlistIcon.setImageResource(R.drawable.ic_bookmark)
                                watchlistIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                                    context.getColor(R.color.text_secondary)
                                )
                                watchlistText.text = "Watchlist"
                                Toast.makeText(context, "Removed from watchlist", Toast.LENGTH_SHORT).show()
                            }
                            null -> {
                                Toast.makeText(context, "Failed to update watchlist", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            } else {
                Toast.makeText(context, "Please login first", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnReviewLog.setOnClickListener {
            bottomSheetDialog.dismiss()
            onLogFilm?.invoke(movie)
        }

        binding.btnGoToFilm.setOnClickListener {
            bottomSheetDialog.dismiss()
            onGoToFilm?.invoke(movie)
        }

        binding.btnViewPoster.setOnClickListener {
            bottomSheetDialog.dismiss()
            showFullPosterDialog(context, movie)
        }

        binding.btnChangePoster.setOnClickListener {
            bottomSheetDialog.dismiss()
            onChangePoster?.invoke(movie)
        }

        binding.btnClose.setOnClickListener {
            bottomSheetDialog.dismiss()
        }

        bottomSheetDialog.show()
    }

    /**
     * Shows a full screen dialog with the movie poster
     */
    fun showFullPosterDialog(context: Context, movie: Movie) {
        val dialog = Dialog(context, android.R.style.Theme_Translucent_NoTitleBar_Fullscreen)
        val binding = DialogFullPosterBinding.inflate(LayoutInflater.from(context))
        dialog.setContentView(binding.root)

        dialog.window?.apply {
            setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT)
            setBackgroundDrawable(ColorDrawable(android.graphics.Color.TRANSPARENT))
        }

        binding.tvMovieTitle.text = movie.title ?: "Movie"
        binding.progressLoading.visibility = View.VISIBLE

        // Load high resolution poster
        val posterUrl = movie.posterUrl?.let { url ->
            when {
                url.contains("w500") -> url.replace("w500", "original")
                url.contains("w342") -> url.replace("w342", "original")
                url.contains("w185") -> url.replace("w185", "original")
                else -> url
            }
        }

        Glide.with(context)
            .load(posterUrl)
            .into(object : com.bumptech.glide.request.target.CustomTarget<android.graphics.drawable.Drawable>() {
                override fun onResourceReady(
                    resource: android.graphics.drawable.Drawable,
                    transition: com.bumptech.glide.request.transition.Transition<in android.graphics.drawable.Drawable>?
                ) {
                    binding.progressLoading.visibility = View.GONE
                    binding.ivFullPoster.setImageDrawable(resource)
                }

                override fun onLoadCleared(placeholder: android.graphics.drawable.Drawable?) {
                    binding.ivFullPoster.setImageDrawable(placeholder)
                }

                override fun onLoadFailed(errorDrawable: android.graphics.drawable.Drawable?) {
                    binding.progressLoading.visibility = View.GONE
                    binding.ivFullPoster.setBackgroundColor(0xFF1E2530.toInt())
                }
            })

        binding.btnClose.setOnClickListener { dialog.dismiss() }
        setupPosterInteraction(binding.ivFullPoster, dialog)

        dialog.show()
    }

    /**
     * Show full poster dialog with just a URL
     */
    fun showFullPosterDialog(context: Context, posterUrl: String, title: String = "") {
        val dialog = Dialog(context, android.R.style.Theme_Translucent_NoTitleBar_Fullscreen)
        val binding = DialogFullPosterBinding.inflate(LayoutInflater.from(context))
        dialog.setContentView(binding.root)

        dialog.window?.apply {
            setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT)
            setBackgroundDrawable(ColorDrawable(android.graphics.Color.TRANSPARENT))
        }

        binding.tvMovieTitle.text = title
        binding.tvMovieTitle.visibility = if (title.isEmpty()) View.GONE else View.VISIBLE
        binding.progressLoading.visibility = View.VISIBLE

        val fullPosterUrl = when {
            posterUrl.contains("w500") -> posterUrl.replace("w500", "original")
            posterUrl.contains("w342") -> posterUrl.replace("w342", "original")
            posterUrl.contains("w185") -> posterUrl.replace("w185", "original")
            else -> posterUrl
        }

        Glide.with(context)
            .load(fullPosterUrl)
            .into(object : com.bumptech.glide.request.target.CustomTarget<android.graphics.drawable.Drawable>() {
                override fun onResourceReady(
                    resource: android.graphics.drawable.Drawable,
                    transition: com.bumptech.glide.request.transition.Transition<in android.graphics.drawable.Drawable>?
                ) {
                    binding.progressLoading.visibility = View.GONE
                    binding.ivFullPoster.setImageDrawable(resource)
                }

                override fun onLoadCleared(placeholder: android.graphics.drawable.Drawable?) {
                    binding.ivFullPoster.setImageDrawable(placeholder)
                }

                override fun onLoadFailed(errorDrawable: android.graphics.drawable.Drawable?) {
                    binding.progressLoading.visibility = View.GONE
                    binding.ivFullPoster.setBackgroundColor(0xFF1E2530.toInt())
                }
            })

        binding.btnClose.setOnClickListener { dialog.dismiss() }
        setupPosterInteraction(binding.ivFullPoster, dialog)

        dialog.show()
    }
    
    /**
     * Update watched button appearance based on watched state
     * @param context Context
     * @param binding Bottom sheet binding
     * @param isWatched Whether the movie is watched (true = green, false = gray)
     */
    /**
     * Attaches pinch-zoom, double-tap-zoom, pan-when-zoomed, and swipe-down-to-dismiss
     * gesture handling to the poster ImageView inside the full poster dialog.
     */
    @android.annotation.SuppressLint("ClickableViewAccessibility")
    private fun setupPosterInteraction(imageView: ImageView, dialog: Dialog) {
        val minScale = 1f
        val maxScale = 3f
        val doubleTapScale = 2f
        var currentScale = 1f

        // --- helpers ---
        fun clampTranslation() {
            val maxTx = imageView.width  * (currentScale - 1f) / 2f
            val maxTy = imageView.height * (currentScale - 1f) / 2f
            imageView.translationX = imageView.translationX.coerceIn(-maxTx, maxTx)
            imageView.translationY = imageView.translationY.coerceIn(-maxTy, maxTy)
        }

        fun animateTo(scale: Float, tx: Float = imageView.translationX, ty: Float = imageView.translationY) {
            imageView.animate().cancel()
            imageView.animate().scaleX(scale).scaleY(scale).translationX(tx).translationY(ty)
                .setDuration(200).start()
            currentScale = scale
        }

        // --- pinch zoom (ScaleGestureDetector only) ---
        val scaleDetector = ScaleGestureDetector(
            imageView.context,
            object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
                override fun onScale(detector: ScaleGestureDetector): Boolean {
                    currentScale = (currentScale * detector.scaleFactor).coerceIn(minScale, maxScale)
                    imageView.scaleX = currentScale
                    imageView.scaleY = currentScale
                    clampTranslation()
                    return true
                }
            }
        )

        // --- double-tap only via GestureDetector ---
        val gestureDetector = GestureDetector(
            imageView.context,
            object : GestureDetector.SimpleOnGestureListener() {
                override fun onDoubleTap(e: MotionEvent): Boolean {
                    if (currentScale > minScale + 0.1f) {
                        animateTo(minScale, 0f, 0f)
                    } else {
                        animateTo(doubleTapScale)
                    }
                    return true
                }
            }
        )
        gestureDetector.setIsLongpressEnabled(false)

        // --- manual touch tracking for smooth pan + swipe-down dismiss ---
        var lastRawX = 0f
        var lastRawY = 0f
        var swipeStartRawY = 0f
        var swipeStartTransY = 0f
        var isPanning = false
        var isSwipeDismiss = false

        imageView.setOnTouchListener { v, event ->
            scaleDetector.onTouchEvent(event)
            gestureDetector.onTouchEvent(event)

            if (scaleDetector.isInProgress) {
                isPanning = false
                isSwipeDismiss = false
                lastRawX = event.rawX
                lastRawY = event.rawY
                return@setOnTouchListener true
            }

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    lastRawX = event.rawX
                    lastRawY = event.rawY
                    swipeStartRawY = event.rawY
                    swipeStartTransY = imageView.translationY
                    isPanning = false
                    isSwipeDismiss = false
                }
                MotionEvent.ACTION_MOVE -> {
                    if (event.pointerCount > 1) return@setOnTouchListener true

                    val dx = event.rawX - lastRawX
                    val dy = event.rawY - lastRawY
                    lastRawX = event.rawX
                    lastRawY = event.rawY

                    val isZoomed = currentScale > minScale + 0.1f

                    if (isZoomed) {
                        // Smooth pan: direct 1:1 raw delta, no GestureDetector lag
                        imageView.translationX += dx
                        imageView.translationY += dy
                        clampTranslation()
                        isPanning = true
                    } else {
                        // Swipe-down to dismiss
                        val totalDy = event.rawY - swipeStartRawY
                        if (!isSwipeDismiss && kotlin.math.abs(totalDy) > 12f) {
                            isSwipeDismiss = true
                        }
                        if (isSwipeDismiss && totalDy > 0f) {
                            v.translationY = swipeStartTransY + totalDy
                        }
                    }
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (event.pointerCount == 1 && currentScale <= minScale + 0.1f) {
                        val totalDy = event.rawY - swipeStartRawY
                        if (isSwipeDismiss && totalDy > 180f) {
                            dialog.dismiss()
                        } else if (isSwipeDismiss) {
                            v.animate().translationY(0f).setDuration(200).start()
                        }
                    }
                    isPanning = false
                    isSwipeDismiss = false
                }
            }
            true
        }
    }

    private fun updateWatchedButtonState(
        context: Context,
        binding: BottomSheetMovieActionsBinding,
        isWatched: Boolean,
        entryType: String = "none"
    ) {
        if (isWatched) {
            val label = when (entryType) {
                "reviewed" -> "Reviewed"
                "logged"   -> "Logged"
                else       -> "Watched"
            }
            binding.tvWatchedLabel.text = label
            binding.tvWatchedLabel.setTextColor(context.getColor(R.color.star_green))
            binding.cardWatched.strokeColor = context.getColor(R.color.star_green)
            binding.ivWatchedIcon.setColorFilter(context.getColor(R.color.star_green))
        } else {
            // Watch state - gray color
            binding.tvWatchedLabel.text = "Watch"
            binding.tvWatchedLabel.setTextColor(context.getColor(R.color.text_secondary))
            binding.cardWatched.strokeColor = context.getColor(R.color.text_secondary)
            binding.ivWatchedIcon.setColorFilter(context.getColor(R.color.text_secondary))
        }
    }

    private fun setupStarRating(
        context: Context,
        binding: BottomSheetMovieActionsBinding,
        lifecycleOwner: LifecycleOwner?,
        movie: Movie,
        userId: Int,
        onRatingSaved: (() -> Unit)?,
        onRatingChanged: (Int) -> Unit
    ) {
        val stars = listOf(
            binding.star1,
            binding.star2,
            binding.star3,
            binding.star4,
            binding.star5
        )

        stars.forEachIndexed { index, star ->
            star.setOnClickListener {
                val newRating = index + 1
                onRatingChanged(newRating) // Update local variable in parent scope
                updateStars(stars, newRating)
                
                // Save rating immediately when star is clicked (direct value, no conversion)
                if (userId > 0 && lifecycleOwner != null) {
                    lifecycleOwner.lifecycleScope.launch {
                        Log.d("MovieActionsHelper", "Star clicked: userId=$userId, movieId=${movie.id}, rating=$newRating")
                        val success = repository.saveRating(userId, movie.id, newRating)
                        if (success) {
                            // Update button to "Watched" (green) immediately after rating
                            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                                updateWatchedButtonState(context, binding, true)
                            }
                            Toast.makeText(context, "Rated: $newRating stars", Toast.LENGTH_SHORT).show()
                            // Trigger callback to refresh data
                            onRatingSaved?.invoke()
                        } else {
                            Toast.makeText(context, "Failed to save rating", Toast.LENGTH_SHORT).show()
                        }
                    }
                } else {
                    Log.e("MovieActionsHelper", "Cannot save rating: userId=$userId, lifecycleOwner=$lifecycleOwner")
                    Toast.makeText(context, "Rated: $newRating stars (please login to save)", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun updateStars(stars: List<ImageView>, rating: Int) {
        stars.forEachIndexed { index, star ->
            if (index < rating) {
                star.setImageResource(R.drawable.ic_star_filled)
                star.imageTintList = android.content.res.ColorStateList.valueOf(
                    star.context.getColor(R.color.star_yellow)
                )
            } else {
                star.setImageResource(R.drawable.ic_star_outline)
                star.imageTintList = android.content.res.ColorStateList.valueOf(
                    star.context.getColor(R.color.text_secondary)
                )
            }
        }
    }

    /**
     * Setup long click listener on a poster ImageView to show movie actions
     */
    fun setupPosterLongClick(
        posterView: View,
        movie: Movie,
        lifecycleOwner: LifecycleOwner? = null,
        isFromMovieDetail: Boolean = false,
        onGoToFilm: ((Movie) -> Unit)? = null,
        onLogFilm: ((Movie) -> Unit)? = null,
        onChangePoster: ((Movie) -> Unit)? = null
    ) {
        posterView.setOnLongClickListener { view ->
            showMovieActionsBottomSheet(
                context = view.context,
                movie = movie,
                lifecycleOwner = lifecycleOwner,
                isFromMovieDetail = isFromMovieDetail,
                onGoToFilm = onGoToFilm,
                onLogFilm = onLogFilm,
                onChangePoster = onChangePoster
            )
            true
        }
    }
}
