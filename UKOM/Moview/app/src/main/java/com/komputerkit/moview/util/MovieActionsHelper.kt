package com.komputerkit.moview.util

import android.app.Dialog
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.Toast
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.BottomSheetMovieActionsBinding
import com.komputerkit.moview.databinding.DialogFullPosterBinding

/**
 * Helper class to show movie action bottom sheet from anywhere in the app.
 * Supports long press on poster to show actions.
 */
object MovieActionsHelper {

    private var currentRating = 0

    /**
     * Shows the movie actions bottom sheet
     * @param context Context
     * @param movie Movie data
     * @param isFromMovieDetail Set true if called from MovieDetailFragment to hide "Go to film" option
     * @param onGoToFilm Callback when "Go to film" is clicked (for navigation)
     * @param onLogFilm Callback when "Review or log" is clicked
     * @param onChangePoster Callback when "Change poster" is clicked
     */
    fun showMovieActionsBottomSheet(
        context: Context,
        movie: Movie,
        isFromMovieDetail: Boolean = false,
        onGoToFilm: ((Movie) -> Unit)? = null,
        onLogFilm: ((Movie) -> Unit)? = null,
        onChangePoster: ((Movie) -> Unit)? = null
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

        // Setup star rating
        setupStarRating(context, binding)

        // Setup click listeners
        binding.btnWatched.setOnClickListener {
            Toast.makeText(context, "Marked as watched", Toast.LENGTH_SHORT).show()
        }

        binding.btnLike.setOnClickListener {
            Toast.makeText(context, "Added to likes", Toast.LENGTH_SHORT).show()
        }

        binding.btnWatchlist.setOnClickListener {
            Toast.makeText(context, "Added to watchlist", Toast.LENGTH_SHORT).show()
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

        binding.tvMovieTitle.text = movie.title
        binding.progressLoading.visibility = View.VISIBLE

        // Load high resolution poster
        val posterUrl = if (movie.posterUrl.contains("w500")) {
            movie.posterUrl.replace("w500", "original")
        } else if (movie.posterUrl.contains("w342")) {
            movie.posterUrl.replace("w342", "original")
        } else if (movie.posterUrl.contains("w185")) {
            movie.posterUrl.replace("w185", "original")
        } else {
            movie.posterUrl
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

    private fun setupStarRating(context: Context, binding: BottomSheetMovieActionsBinding) {
        val stars = listOf(
            binding.star1,
            binding.star2,
            binding.star3,
            binding.star4,
            binding.star5
        )

        stars.forEachIndexed { index, star ->
            star.setOnClickListener {
                currentRating = index + 1
                updateStars(stars, currentRating)
                Toast.makeText(context, "Rated: $currentRating stars", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateStars(stars: List<ImageView>, rating: Int) {
        stars.forEachIndexed { index, star ->
            if (index < rating) {
                star.setImageResource(R.drawable.ic_star_filled)
            } else {
                star.setImageResource(R.drawable.ic_star_outline)
            }
        }
    }

    /**
     * Setup long click listener on a poster ImageView to show movie actions
     */
    fun setupPosterLongClick(
        posterView: View,
        movie: Movie,
        isFromMovieDetail: Boolean = false,
        onGoToFilm: ((Movie) -> Unit)? = null,
        onLogFilm: ((Movie) -> Unit)? = null,
        onChangePoster: ((Movie) -> Unit)? = null
    ) {
        posterView.setOnLongClickListener { view ->
            showMovieActionsBottomSheet(
                context = view.context,
                movie = movie,
                isFromMovieDetail = isFromMovieDetail,
                onGoToFilm = onGoToFilm,
                onLogFilm = onLogFilm,
                onChangePoster = onChangePoster
            )
            true
        }
    }
}
