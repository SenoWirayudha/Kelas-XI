package com.komputerkit.moview.util

import android.app.Dialog
import android.content.Context
import android.content.ContextWrapper
import android.util.Log
import android.view.LayoutInflater
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
        onRatingSaved: (() -> Unit)? = null
    ) {
        val bottomSheetDialog = BottomSheetDialog(context)
        val binding = BottomSheetMovieActionsBinding.inflate(LayoutInflater.from(context))
        bottomSheetDialog.setContentView(binding.root)
        
        // Remove white background/border from bottom sheet
        bottomSheetDialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        // Set movie data
        binding.tvMovieTitle.text = movie.title
        binding.tvMovieYear.text = movie.releaseYear.toString()

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
                
                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                    if (ratingResponse != null && ratingResponse.is_watched) {
                        // User has watched this movie (either rated or just marked as watched)
                        currentRating = ratingResponse.rating ?: 0
                        updateStars(stars, currentRating)
                        // Update button to "Watched" (green)
                        updateWatchedButtonState(context, binding, true)
                        Log.d("MovieActionsHelper", "Movie is watched. Rating: ${ratingResponse.rating} stars for movie ${movie.id}")
                    } else {
                        // No rating found, set to default empty state
                        updateStars(stars, 0)
                        updateWatchedButtonState(context, binding, false)
                        Log.d("MovieActionsHelper", "Movie not watched, setting default UI")
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
                    // Save rating directly (0-5 stars, no conversion)
                    val ratingValue = currentRating
                    Log.d("MovieActionsHelper", "Saving rating: userId=$userId, movieId=${movie.id}, rating=$ratingValue")
                    val success = repository.saveRating(userId, movie.id, ratingValue)
                    if (success) {
                        // Update UI to "Watched" state (green) BEFORE dismissing
                        updateWatchedButtonState(context, binding, true)
                        Toast.makeText(context, "Marked as watched", Toast.LENGTH_SHORT).show()
                        // Trigger callback to refresh data
                        onRatingSaved?.invoke()
                        // Add delay to show color change before dismissing
                        kotlinx.coroutines.delay(300)
                        bottomSheetDialog.dismiss()
                    } else {
                        Toast.makeText(context, "Failed to save", Toast.LENGTH_SHORT).show()
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
                                // Now liked - also mark as watched with rating 0
                                likeIcon.setImageResource(R.drawable.ic_heart_filled)
                                likeIcon.imageTintList = android.content.res.ColorStateList.valueOf(
                                    context.getColor(R.color.red)
                                )
                                likeText.text = "Liked"
                                
                                // Auto-mark as watched with rating 0
                                val saveSuccess = repository.saveRating(userId, movie.id, 0)
                                if (saveSuccess) {
                                    // Update watched button to green
                                    updateWatchedButtonState(context, binding, true)
                                    // Clear all stars (rating 0)
                                    stars.forEach { star ->
                                        star.setImageResource(R.drawable.ic_star_outline)
                                        star.imageTintList = android.content.res.ColorStateList.valueOf(
                                            context.getColor(R.color.text_secondary)
                                        )
                                    }
                                    currentRating = 0
                                    Toast.makeText(context, "Added to likes and marked as watched", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(context, "Added to likes", Toast.LENGTH_SHORT).show()
                                }
                                
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

        binding.btnShareBottom.setOnClickListener {
            Toast.makeText(context, "Share ${movie.title}", Toast.LENGTH_SHORT).show()
            bottomSheetDialog.dismiss()
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
        val dialog = Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        val binding = DialogFullPosterBinding.inflate(LayoutInflater.from(context))
        dialog.setContentView(binding.root)

        // Make it full screen
        dialog.window?.apply {
            setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT)
            setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            )
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
                    // Show a dark background as fallback
                    binding.ivFullPoster.setBackgroundColor(0xFF1E2530.toInt())
                }
            })

        binding.btnClose.setOnClickListener {
            dialog.dismiss()
        }

        // Also dismiss when clicking on the poster
        binding.ivFullPoster.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    /**
     * Show full poster dialog with just a URL
     */
    fun showFullPosterDialog(context: Context, posterUrl: String, title: String = "") {
        val dialog = Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        val binding = DialogFullPosterBinding.inflate(LayoutInflater.from(context))
        dialog.setContentView(binding.root)

        dialog.window?.apply {
            setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT)
            setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            )
        }

        binding.tvMovieTitle.text = title
        binding.tvMovieTitle.visibility = if (title.isEmpty()) View.GONE else View.VISIBLE
        binding.progressLoading.visibility = View.VISIBLE

        // Load high resolution poster
        val fullPosterUrl = if (posterUrl.contains("w500")) {
            posterUrl.replace("w500", "original")
        } else if (posterUrl.contains("w342")) {
            posterUrl.replace("w342", "original")
        } else if (posterUrl.contains("w185")) {
            posterUrl.replace("w185", "original")
        } else {
            posterUrl
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
                    // Show a dark background as fallback
                    binding.ivFullPoster.setBackgroundColor(0xFF1E2530.toInt())
                }
            })

        binding.btnClose.setOnClickListener {
            dialog.dismiss()
        }

        binding.ivFullPoster.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }
    
    /**
     * Update watched button appearance based on watched state
     * @param context Context
     * @param binding Bottom sheet binding
     * @param isWatched Whether the movie is watched (true = green, false = gray)
     */
    private fun updateWatchedButtonState(
        context: Context,
        binding: BottomSheetMovieActionsBinding,
        isWatched: Boolean
    ) {
        if (isWatched) {
            // Watched state - green color
            binding.tvWatchedLabel.text = "Watched"
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
