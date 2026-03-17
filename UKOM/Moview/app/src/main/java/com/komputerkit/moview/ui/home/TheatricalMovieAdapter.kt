package com.komputerkit.moview.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.MarginLayoutParams
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.model.TheatricalMovie
import com.komputerkit.moview.databinding.ItemTheatricalMovieBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadThumbnail
import java.text.SimpleDateFormat
import java.util.Locale

class TheatricalMovieAdapter(
    private val onMovieClick: (TheatricalMovie) -> Unit,
    private val onBuyTicketClick: ((TheatricalMovie) -> Unit)? = null,
    /** When true every item shows the date/coming-soon badge (use for Upcoming section) */
    private val showDateBadge: Boolean = false,
    private val gridMode: Boolean = false,
    private val onLongPressGoToFilm: ((TheatricalMovie) -> Unit)? = null,
    private val onLogFilm: ((TheatricalMovie) -> Unit)? = null,
    private val onChangePoster: ((TheatricalMovie) -> Unit)? = null
) : RecyclerView.Adapter<TheatricalMovieAdapter.TheatricalMovieViewHolder>() {

    private var movies: List<TheatricalMovie> = emptyList()

    fun submitList(list: List<TheatricalMovie>) {
        movies = list
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TheatricalMovieViewHolder {
        val binding = ItemTheatricalMovieBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return TheatricalMovieViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TheatricalMovieViewHolder, position: Int) {
        holder.bind(movies[position])
    }

    override fun getItemCount(): Int = movies.size

    inner class TheatricalMovieViewHolder(
        private val binding: ItemTheatricalMovieBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(movie: TheatricalMovie) {
            if (gridMode) {
                binding.root.layoutParams = (binding.root.layoutParams as RecyclerView.LayoutParams).apply {
                    width = ViewGroup.LayoutParams.MATCH_PARENT
                    if (this is MarginLayoutParams) {
                        marginEnd = 0
                        marginStart = 0
                    }
                }
            }

            binding.ivPoster.loadThumbnail(movie.posterUrl)

            // Title
            binding.tvTitle.text = movie.title

            // Genre • Year info row
            val parts = listOfNotNull(
                movie.genre?.takeIf { it.isNotBlank() },
                movie.year?.toString()?.takeIf { it.isNotBlank() }
            )
            binding.tvMovieInfo.text = parts.joinToString(" • ")
            binding.tvMovieInfo.visibility = if (parts.isEmpty()) View.GONE else View.VISIBLE

            // Age rating badge (always shown if present, regardless of section)
            val rating = movie.ageRating?.takeIf { it.isNotBlank() && it != "NR" }
            if (rating != null) {
                binding.tvAgeRating.visibility = View.VISIBLE
                binding.tvAgeRating.text = rating
            } else {
                binding.tvAgeRating.visibility = View.GONE
            }

            binding.tvPreorderBadge.visibility = if (movie.isPreorder) View.VISIBLE else View.GONE

            if (showDateBadge) {
                binding.vScrim.visibility = View.VISIBLE
                binding.tvBadge.visibility = View.VISIBLE
                val badgeText = if (!movie.releaseDate.isNullOrBlank()) {
                    try {
                        val inFmt = SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH)
                        val outFmt = SimpleDateFormat("d MMM yyyy", Locale.ENGLISH)
                        val date = inFmt.parse(movie.releaseDate)
                        if (date != null) outFmt.format(date) else "Coming Soon"
                    } catch (e: Exception) {
                        "Coming Soon"
                    }
                } else {
                    "Coming Soon"
                }
                binding.tvBadge.text = badgeText
            } else {
                binding.vScrim.visibility = if (rating != null) View.VISIBLE else View.GONE
                binding.tvBadge.visibility = View.GONE
            }

            if (onBuyTicketClick != null) {
                binding.btnBuyTicket.visibility = View.VISIBLE
                binding.btnBuyTicket.setOnClickListener { onBuyTicketClick.invoke(movie) }
            } else {
                binding.btnBuyTicket.visibility = View.GONE
            }

            binding.root.setOnClickListener { onMovieClick(movie) }

            binding.root.setOnLongClickListener { view ->
                val movieModel = Movie(
                    id = movie.id,
                    title = movie.title,
                    posterUrl = movie.posterUrl,
                    averageRating = null,
                    genre = movie.genre,
                    releaseYear = movie.year,
                    description = null
                )
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movieModel,
                    isFromMovieDetail = false,
                    onGoToFilm = { onLongPressGoToFilm?.invoke(movie) ?: onMovieClick(movie) },
                    onLogFilm = { onLogFilm?.invoke(movie) },
                    onChangePoster = { onChangePoster?.invoke(movie) }
                )
                true
            }
        }
    }
}