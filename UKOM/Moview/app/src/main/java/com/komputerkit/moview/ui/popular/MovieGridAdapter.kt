package com.komputerkit.moview.ui.popular

import android.view.LayoutInflater
import android.view.ViewGroup

import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemMovieGridBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.ui.common.FilmGridCell
import com.komputerkit.moview.ui.common.FilmGridDiff
import com.komputerkit.moview.ui.common.FilmGridSizes

class MovieGridAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onLogFilm: ((Movie) -> Unit)? = null,
    private val onChangePoster: ((Movie) -> Unit)? = null
) : ListAdapter<Movie, MovieGridAdapter.MovieGridViewHolder>(FilmGridDiff) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MovieGridViewHolder {
        val binding = ItemMovieGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return MovieGridViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MovieGridViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class MovieGridViewHolder(
        private val binding: ItemMovieGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(movie: Movie) {
            // Fixed 2:3 decode target (3-column grid) so re-binding on scroll is a
            // memory-cache hit instead of a full-resolution decode.
            // Poster box uses a 2:3 ratio constraint: its size is known only after
            // layout, so the exact target is taken from the cell here.
            val (w, h) = FilmGridSizes.cellFor(binding.root, GRID_SPAN) ?: (0 to 0)
            FilmGridCell.loadPoster(binding.ivPoster, movie.posterUrl, movie.title, w, h)

            // Set rating
            binding.tvRating.text = String.format("%.1f", movie.averageRating)

            // Set title
            binding.tvTitle.text = movie.title

            // Set movie info (year and genre)
            binding.tvMovieInfo.text = "${movie.releaseYear} • ${movie.genre}"

            // Click listener
            binding.root.setOnClickListener {
                onMovieClick(movie)
            }

            // Long press to show movie actions
            binding.root.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = onMovieClick,
                    onLogFilm = onLogFilm,
                    onChangePoster = onChangePoster
                )
                true
            }
        }
    }

    private companion object {
        /** Popular Movies grid is 3 columns. */
        const val GRID_SPAN = 3

    }
}
