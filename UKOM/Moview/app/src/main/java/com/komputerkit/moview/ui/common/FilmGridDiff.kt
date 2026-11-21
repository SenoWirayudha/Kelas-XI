package com.komputerkit.moview.ui.common

import androidx.recyclerview.widget.DiffUtil
import com.komputerkit.moview.data.model.Movie

/**
 * DiffUtil for film grids. `Movie` is a large data class (cast, releases, lists,
 * ...); a full deep `equals` per item on every page append was expensive. A grid
 * cell only draws the fields compared here, so a change in any of them is still
 * detected and everything else is ignored.
 */
object FilmGridDiff : DiffUtil.ItemCallback<Movie>() {

    override fun areItemsTheSame(oldItem: Movie, newItem: Movie): Boolean =
        oldItem.id == newItem.id

    override fun areContentsTheSame(oldItem: Movie, newItem: Movie): Boolean =
        oldItem.posterUrl == newItem.posterUrl &&
            oldItem.title == newItem.title &&
            oldItem.userRating == newItem.userRating &&
            oldItem.isLiked == newItem.isLiked &&
            oldItem.hasReview == newItem.hasReview &&
            oldItem.reviewId == newItem.reviewId &&
            oldItem.averageRating == newItem.averageRating &&
            oldItem.releaseYear == newItem.releaseYear &&
            oldItem.genre == newItem.genre &&
            oldItem.friendCount == newItem.friendCount
}
