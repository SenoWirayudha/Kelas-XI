package com.komputerkit.moview.ui.crew

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemFilmGridBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadThumbnail

class FilmographyAdapter(
    private val onFilmClick: (Film) -> Unit,
    private val onLogFilm: ((Film) -> Unit)? = null,
    private val onChangePoster: ((Film) -> Unit)? = null
) : ListAdapter<Film, FilmographyAdapter.FilmViewHolder>(FilmDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilmViewHolder {
        val binding = ItemFilmGridBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FilmViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FilmViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class FilmViewHolder(
        private val binding: ItemFilmGridBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(film: Film) {
            binding.ivPoster.setImageDrawable(null)

            binding.ivPoster.post {
                val fixedUrl = if (film.posterUrl.isNotEmpty()) com.komputerkit.moview.util.ServerConfig.fixUrl(film.posterUrl) else film.posterUrl
                val width = binding.ivPoster.width
                if (width > 0) {
                    val height = (width * 1.5).toInt()
                    Glide.with(binding.ivPoster.context)
                        .load(fixedUrl)
                        .override(width, height)
                        .placeholder(com.komputerkit.moview.util.PosterFallbackDrawable(binding.ivPoster.context, film.title))
                        .error(com.komputerkit.moview.util.PosterFallbackDrawable(binding.ivPoster.context, film.title))
                        .centerCrop()
                        .into(binding.ivPoster)
                } else {
                    binding.ivPoster.loadThumbnail(fixedUrl, film.title)
                }
            }

            binding.ratingContainer.visibility = View.GONE
            binding.icHasReview.visibility = View.GONE

            binding.posterContainer.setOnClickListener {
                onFilmClick(film)
            }

            binding.posterContainer.setOnLongClickListener { view ->
                val movie = Movie(
                    id = film.id,
                    title = film.title,
                    posterUrl = film.posterUrl,
                    averageRating = null,
                    genre = null,
                    releaseYear = film.year.toIntOrNull(),
                    description = null
                )
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movie,
                    isFromMovieDetail = false,
                    onGoToFilm = { onFilmClick(film) },
                    onLogFilm = { onLogFilm?.invoke(film) },
                    onChangePoster = { onChangePoster?.invoke(film) }
                )
                true
            }
        }
    }

    private class FilmDiffCallback : DiffUtil.ItemCallback<Film>() {
        override fun areItemsTheSame(
            oldItem: Film,
            newItem: Film
        ): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(
            oldItem: Film,
            newItem: Film
        ): Boolean {
            return oldItem == newItem
        }
    }
}
