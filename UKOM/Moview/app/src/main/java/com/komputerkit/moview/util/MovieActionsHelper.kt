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
import com.google.android.material.snackbar.Snackbar
import androidx.core.content.ContextCompat
import androidx.navigation.Navigation
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
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.showSnackbarWithDialog
import com.komputerkit.moview.util.SnackbarType
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
        onWatchedTap: ((reviewId: Int, isLog: Boolean) -> Unit)? = null,
        onShowYourActivityTap: ((movieId: Int, userId: Int) -> Unit)? = null
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
        var currentRating = 0f
        var watchInfo: com.komputerkit.moview.data.api.WatchCountDto? = null
        var isWatchedState = false  // tracks current watched toggle state
        
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

                    val watchCount = watchInfoResult?.watch_count ?: 0
                    binding.btnShowYourActivity.visibility = if (watchCount > 0) View.VISIBLE else View.GONE

                    // Load rating if exists
                    if (ratingResponse != null) {
currentRating = ratingResponse.rating ?: 0f
                        binding.starRating.rating = currentRating
                        Log.d("MovieActionsHelper", "Loaded rating: ${ratingResponse.rating} stars for movie ${movie.id}")
                    } else {
                        binding.starRating.rating = 0f
                        Log.d("MovieActionsHelper", "No rating found for movie ${movie.id}")
                    }
                    
                    // Icon watch state: from ratings table (is_watched), label from entry_type
                    val isWatched = ratingResponse?.is_watched ?: false
                    isWatchedState = isWatched
                    val entryType = watchInfoResult?.entry_type ?: "none"
                    updateWatchedButtonState(context, binding, isWatched, entryType)
                    Log.d("MovieActionsHelper", "Watch icon state: isWatched=$isWatched, entryType=$entryType")
                    
                    // Text "Review and log again": from diary entries count
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
            binding.starRating.rating = 0f
            updateWatchedButtonState(context, binding, false)
            binding.btnShowYourActivity.visibility = View.GONE
        }

        // Setup star rating (pass currentRating via closure)
        setupStarRating(
            context,
            binding,
            actualLifecycleOwner,
            movie,
            userId,
            onRatingSaved,
            onRatingChanged = { newRating -> currentRating = newRating },
            bottomSheetDialog = bottomSheetDialog
        )
        // Setup click listeners
        binding.btnWatched.setOnClickListener {
            if (userId > 0 && actualLifecycleOwner != null) {
                val currentEntryType = watchInfo?.entry_type ?: "none"
                // If "Reviewed" or "Logged", navigate to detail instead of toggling
                if (isWatchedState && (currentEntryType == "reviewed" || currentEntryType == "logged")) {
                    val reviewId = watchInfo?.latest_review_id ?: 0
                    val diaryId = watchInfo?.latest_diary_id ?: 0
                    val isLog = currentEntryType == "logged"
                    val navId = if (isLog) diaryId else reviewId
                    if (navId > 0) {
                        if (onWatchedTap != null) {
                            bottomSheetDialog.dismiss()
                            onWatchedTap.invoke(navId, isLog)
                        } else {
                            // Try to find NavController from context
                            try {
                                val activity = context as android.app.Activity
                                val navController = androidx.navigation.Navigation.findNavController(
                                    activity, R.id.nav_host_fragment
                                )
                                bottomSheetDialog.dismiss()
                                val bundle = android.os.Bundle().apply {
                                    putInt("reviewId", navId)
                                    putBoolean("isLog", isLog)
                                    if (isLog) putInt("diaryId", diaryId)
                                }
                                navController.navigate(R.id.reviewDetailFragment, bundle)
                            } catch (e: Exception) {
                                Log.e("MovieActionsHelper", "Cannot navigate to review detail", e)
                            }
                        }
                        return@setOnClickListener
                    }
                }
                actualLifecycleOwner.lifecycleScope.launch {
                    if (isWatchedState) {
                        // Already watched → toggle OFF: delete from ratings
                        Log.d("MovieActionsHelper", "Unwatching: userId=$userId, movieId=${movie.id}")
                        val success = repository.deleteRating(userId, movie.id)
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                            if (success) {
                                isWatchedState = false
                                val updatedInfo = repository.getWatchInfo(userId, movie.id)
                                watchInfo = updatedInfo
                                updateWatchedButtonState(context, binding, false, "none")
                                // Reset stars
                                currentRating = 0f
                                binding.starRating.rating = 0f
                                val updatedWatchCount = updatedInfo?.watch_count ?: 0
                                binding.btnShowYourActivity.visibility = if (updatedWatchCount > 0) View.VISIBLE else View.GONE
                                binding.tvReviewLogText.text = if (updatedWatchCount > 0) "Review and log again" else "Review and log"
                                val updatedRewatchCount = updatedInfo?.rewatch_count ?: 0
                                if (updatedRewatchCount > 0) {
                                    binding.layoutRewatch.visibility = View.VISIBLE
                                    binding.tvRewatchCount.text = "Rewatch × $updatedRewatchCount"
                                } else {
                                    binding.layoutRewatch.visibility = View.GONE
                                }
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Removed from watched", bottomSheetDialog, SnackbarType.SUCCESS)
                                onRatingSaved?.invoke()
                            } else {
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Failed to unwatch", bottomSheetDialog, SnackbarType.ERROR)
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
                                val updatedWatchCount = updatedInfo?.watch_count ?: 0
                                binding.btnShowYourActivity.visibility = if (updatedWatchCount > 0) View.VISIBLE else View.GONE
                                binding.tvReviewLogText.text = if (updatedWatchCount > 0) "Review and log again" else "Review and log"
                                val updatedRewatchCount = updatedInfo?.rewatch_count ?: 0
                                if (updatedRewatchCount > 0) {
                                    binding.layoutRewatch.visibility = View.VISIBLE
                                    binding.tvRewatchCount.text = "Rewatch × $updatedRewatchCount"
                                } else {
                                    binding.layoutRewatch.visibility = View.GONE
                                }
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Marked as watched", bottomSheetDialog, SnackbarType.SUCCESS)
                                onRatingSaved?.invoke()
                            } else {
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Failed to save", bottomSheetDialog, SnackbarType.ERROR)
                            }
                        }
                    }
                }
            } else {
                Log.e("MovieActionsHelper", "Cannot save: userId=$userId, lifecycleOwner=$actualLifecycleOwner")
                (context as? android.app.Activity)?.showSnackbarWithDialog("Please login first", bottomSheetDialog, SnackbarType.ERROR)
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
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Added to likes", bottomSheetDialog, SnackbarType.SUCCESS)
                                
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
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Removed from likes", bottomSheetDialog, SnackbarType.SUCCESS)
                                
                                // Trigger callback to refresh data
                                onRatingSaved?.invoke()
                            }
                            null -> {
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Failed to update like", bottomSheetDialog, SnackbarType.ERROR)
                            }
                        }
                    }
                }
            } else {
                (context as? android.app.Activity)?.showSnackbarWithDialog("Please login first", bottomSheetDialog, SnackbarType.ERROR)
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
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Added to watchlist", bottomSheetDialog, SnackbarType.SUCCESS)
                            }
                            false -> {
                                // Removed from watchlist
                                watchlistIcon.setImageResource(R.drawable.ic_bookmark)
                                watchlistIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                                    context.getColor(R.color.text_secondary)
                                )
                                watchlistText.text = "Watchlist"
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Removed from watchlist", bottomSheetDialog, SnackbarType.SUCCESS)
                            }
                            null -> {
                                (context as? android.app.Activity)?.showSnackbarWithDialog("Failed to update watchlist", bottomSheetDialog, SnackbarType.ERROR)
                            }
                        }
                    }
                }
            } else {
                (context as? android.app.Activity)?.showSnackbarWithDialog("Please login first", bottomSheetDialog, SnackbarType.ERROR)
            }
        }

        binding.btnReviewLog.setOnClickListener {
            bottomSheetDialog.dismiss()
            onLogFilm?.invoke(movie)
        }

        binding.btnShowYourActivity.setOnClickListener {
            val info = watchInfo
            val watchCount = info?.watch_count ?: 0
            if (watchCount <= 0 || userId <= 0) {
                return@setOnClickListener
            }

            bottomSheetDialog.dismiss()

            if (onShowYourActivityTap != null) {
                onShowYourActivityTap.invoke(movie.id, userId)
                return@setOnClickListener
            }

            try {
                val activity = context as android.app.Activity
                val navController = Navigation.findNavController(activity, R.id.nav_host_fragment)

                if (watchCount > 1) {
                    val bundle = android.os.Bundle().apply {
                        putInt("userId", userId)
                        putInt("filmId", movie.id)
                    }
                    navController.navigate(R.id.userFilmActivityFragment, bundle)
                } else {
                    val latestReviewId = info?.latest_review_id ?: 0
                    val latestDiaryId = info?.latest_diary_id ?: 0

                    if (latestReviewId > 0) {
                        val bundle = android.os.Bundle().apply {
                            putInt("reviewId", latestReviewId)
                            putBoolean("isLog", false)
                        }
                        navController.navigate(R.id.reviewDetailFragment, bundle)
                    } else if (latestDiaryId > 0) {
                        val bundle = android.os.Bundle().apply {
                            putInt("reviewId", latestDiaryId)
                            putBoolean("isLog", true)
                            putInt("diaryId", latestDiaryId)
                        }
                        navController.navigate(R.id.reviewDetailFragment, bundle)
                    }
                }
            } catch (e: Exception) {
                Log.e("MovieActionsHelper", "Cannot navigate to show your activity", e)
            }
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

        val fixedPosterUrl = if (posterUrl != null) ServerConfig.fixUrl(posterUrl) else posterUrl
        Glide.with(context)
            .load(fixedPosterUrl)
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

        val fixedFullPosterUrl = ServerConfig.fixUrl(fullPosterUrl)
        Glide.with(context)
            .load(fixedFullPosterUrl)
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
        // Keep XML fitCenter for correct initial centering; switch to MATRIX on first zoom.
        val matrix = android.graphics.Matrix()
        val tempValues = FloatArray(9)
        val minScale = 1f
        val maxScale = 3f
        val doubleTapScale = 2f
        var currentScale = 1f
        var baseScale = 1f
        var matrixInitialized = false

        fun getMatrixScale(): Float {
            matrix.getValues(tempValues)
            return tempValues[android.graphics.Matrix.MSCALE_X]
        }

        fun clampMatrix() {
            val d = imageView.drawable ?: return
            if (imageView.width == 0 || imageView.height == 0) return
            val viewW = imageView.width.toFloat()
            val viewH = imageView.height.toFloat()
            val rect = android.graphics.RectF(0f, 0f, d.intrinsicWidth.toFloat(), d.intrinsicHeight.toFloat())
            matrix.mapRect(rect)
            val totalScale = getMatrixScale() / baseScale
            // When zoomed to 1x (fit), keep centered; when zoomed, keep edges from showing background
            var dx = 0f
            var dy = 0f
            if (rect.width() <= viewW) {
                dx = (viewW - rect.width()) / 2f - rect.left
            } else {
                if (rect.left > 0f) dx = -rect.left
                if (rect.right < viewW) dx = viewW - rect.right
            }
            if (rect.height() <= viewH) {
                dy = (viewH - rect.height()) / 2f - rect.top
            } else {
                if (rect.top > 0f) dy = -rect.top
                if (rect.bottom < viewH) dy = viewH - rect.bottom
            }
            // Don't fight swipe-dismiss translation when at minScale; keep image centered
            if (totalScale <= 1.01f) {
                // keep centered, swipe uses view.translationY not matrix
            }
            matrix.postTranslate(dx, dy)
        }

        fun ensureMatrixInitialized(): Boolean {
            if (matrixInitialized) return true
            val d = imageView.drawable ?: return false
            if (imageView.width == 0 || imageView.height == 0) return false
            val vw = imageView.width.toFloat()
            val vh = imageView.height.toFloat()
            val dw = d.intrinsicWidth.toFloat()
            val dh = d.intrinsicHeight.toFloat()
            if (dw == 0f || dh == 0f) return false
            val scale = minOf(vw / dw, vh / dh)
            baseScale = scale
            currentScale = 1f
            matrix.reset()
            matrix.postScale(scale, scale)
            matrix.postTranslate((vw - dw * scale) / 2f, (vh - dh * scale) / 2f)
            imageView.scaleType = ImageView.ScaleType.MATRIX
            imageView.imageMatrix = matrix
            matrixInitialized = true
            return true
        }

        fun resetMatrixToFitCenter() {
            val d = imageView.drawable ?: return
            if (imageView.width == 0 || imageView.height == 0) {
                imageView.post { resetMatrixToFitCenter() }
                return
            }
            val vw = imageView.width.toFloat()
            val vh = imageView.height.toFloat()
            val dw = d.intrinsicWidth.toFloat()
            val dh = d.intrinsicHeight.toFloat()
            if (dw == 0f || dh == 0f) return
            val scale = minOf(vw / dw, vh / dh)
            baseScale = scale
            currentScale = 1f
            matrix.reset()
            matrix.postScale(scale, scale)
            matrix.postTranslate((vw - dw * scale) / 2f, (vh - dh * scale) / 2f)
            imageView.scaleType = ImageView.ScaleType.MATRIX
            imageView.imageMatrix = matrix
            matrixInitialized = true
        }

        fun animateMatrixTo(targetScale: Float, focusX: Float? = null, focusY: Float? = null) {
            val startScale = currentScale
            val viewW = imageView.width.toFloat()
            val viewH = imageView.height.toFloat()
            val fx = focusX ?: viewW / 2f
            val fy = focusY ?: viewH / 2f
            val anim = android.animation.ValueAnimator.ofFloat(0f, 1f)
            val startMatrix = android.graphics.Matrix(matrix)
            anim.duration = 220
            anim.interpolator = android.view.animation.DecelerateInterpolator()
            anim.addUpdateListener { va ->
                val t = va.animatedValue as Float
                val s = startScale + (targetScale - startScale) * t
                val factor = s / getMatrixScale() * baseScale
                // interpolate from startMatrix towards target
                matrix.set(startMatrix)
                // scale delta from start to current interpolated scale
                val scaleFactor = s / startScale
                matrix.postScale(scaleFactor, scaleFactor, fx, fy)
                clampMatrix()
                imageView.imageMatrix = matrix
                if (t >= 1f) currentScale = targetScale
            }
            anim.start()
        }

        val scaleDetector = ScaleGestureDetector(
            imageView.context,
            object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
                override fun onScale(detector: ScaleGestureDetector): Boolean {
                    if (!matrixInitialized && !ensureMatrixInitialized()) return true
                    val factor = detector.scaleFactor
                    val newScale = (currentScale * factor).coerceIn(minScale, maxScale)
                    val actualFactor = newScale / currentScale
                    if (actualFactor == 1f) return true
                    matrix.postScale(actualFactor, actualFactor, detector.focusX, detector.focusY)
                    currentScale = newScale
                    clampMatrix()
                    imageView.imageMatrix = matrix
                    return true
                }
            }
        )

        val gestureDetector = GestureDetector(
            imageView.context,
            object : GestureDetector.SimpleOnGestureListener() {
                override fun onDoubleTap(e: MotionEvent): Boolean {
                    if (!matrixInitialized) ensureMatrixInitialized()
                    if (currentScale > minScale + 0.1f) {
                        // animate back to fit
                        val anim = android.animation.ValueAnimator.ofFloat(0f, 1f)
                        val startMatrix = android.graphics.Matrix(matrix)
                        val startScale = currentScale
                        anim.duration = 220
                        anim.interpolator = android.view.animation.DecelerateInterpolator()
                        anim.addUpdateListener { va ->
                            val t = va.animatedValue as Float
                            matrix.set(startMatrix)
                            val s = startScale + (1f - startScale) * t
                            val f = s / startScale
                            matrix.postScale(f, f, imageView.width / 2f, imageView.height / 2f)
                            if (t >= 0.99f) resetMatrixToFitCenter() else {
                                clampMatrix()
                                imageView.imageMatrix = matrix
                            }
                        }
                        anim.addUpdateListener { }
                        anim.start()
                        // reset will be called at end; ensure currentScale updated
                        imageView.postDelayed({ currentScale = 1f }, 230)
                    } else {
                        animateMatrixTo(doubleTapScale, e.x, e.y)
                    }
                    return true
                }
            }
        )
        gestureDetector.setIsLongpressEnabled(false)

        var lastX = 0f
        var lastY = 0f
        var swipeStartY = 0f
        var isSwipe = false
        var swipeBaseTransY = 0f

        imageView.setOnTouchListener { v, event ->
            scaleDetector.onTouchEvent(event)
            gestureDetector.onTouchEvent(event)

            if (scaleDetector.isInProgress) {
                isSwipe = false
                return@setOnTouchListener true
            }

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    lastX = event.x
                    lastY = event.y
                    swipeStartY = event.rawY
                    swipeBaseTransY = v.translationY
                    isSwipe = false
                }
                MotionEvent.ACTION_MOVE -> {
                    if (event.pointerCount != 1) return@setOnTouchListener true
                    val dx = event.x - lastX
                    val dy = event.y - lastY
                    lastX = event.x
                    lastY = event.y
                    if (currentScale > 1.01f) {
                        matrix.postTranslate(dx, dy)
                        clampMatrix()
                        imageView.imageMatrix = matrix
                    } else {
                        val totalDy = event.rawY - swipeStartY
                        if (!isSwipe && kotlin.math.abs(totalDy) > 12f) isSwipe = true
                        if (isSwipe && totalDy > 0f) {
                            v.translationY = swipeBaseTransY + totalDy
                            // fade background with swipe
                            val progress = (totalDy / (v.height * 0.5f)).coerceIn(0f, 1f)
                            dialog.window?.decorView?.alpha = 1f - progress * 0.5f
                        }
                    }
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (currentScale <= 1.01f && isSwipe) {
                        val totalDy = event.rawY - swipeStartY
                        if (totalDy > 180f) {
                            dialog.dismiss()
                        } else {
                            v.animate().translationY(0f).setDuration(200).start()
                            dialog.window?.decorView?.animate()?.alpha(1f)?.setDuration(200)?.start()
                        }
                    }
                    isSwipe = false
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
        onRatingChanged: (Float) -> Unit,
        bottomSheetDialog: BottomSheetDialog? = null
    ) {
        binding.starRating.apply {
            starSizeDp = 44f
            starGapDp = 4f
            setColors(
                ContextCompat.getColor(binding.root.context, R.color.star_yellow),
                ContextCompat.getColor(binding.root.context, R.color.text_secondary)
            )
            setEditable(true) { newRating ->
                onRatingChanged(newRating) // Update local variable in parent scope

                // Save rating immediately when star is tapped (direct value, no conversion)
                if (userId > 0 && lifecycleOwner != null) {
                    val ratingToSave = newRating
                    lifecycleOwner.lifecycleScope.launch {
                        Log.d("MovieActionsHelper", "Star tapped: userId=$userId, movieId=${movie.id}, rating=$ratingToSave")
                        val success = repository.saveRating(userId, movie.id, ratingToSave)
                        if (success) {
                            // Update button to "Watched" (green) immediately after rating
                            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                                updateWatchedButtonState(context, binding, true)
                            }
                            (context as? android.app.Activity)?.showSnackbarWithDialog("Rated: $ratingToSave stars", bottomSheetDialog, SnackbarType.SUCCESS)
                            // Trigger callback to refresh data
                            onRatingSaved?.invoke()
                        } else {
                            (context as? android.app.Activity)?.showSnackbarWithDialog("Failed to save rating", bottomSheetDialog, SnackbarType.ERROR)
                        }
                    }
                } else {
                    Log.e("MovieActionsHelper", "Cannot save rating: userId=$userId, lifecycleOwner=$lifecycleOwner")
                    (context as? android.app.Activity)?.showSnackbarWithDialog("Rated: $newRating stars (please login to save)", bottomSheetDialog, SnackbarType.SUCCESS)
                }
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
