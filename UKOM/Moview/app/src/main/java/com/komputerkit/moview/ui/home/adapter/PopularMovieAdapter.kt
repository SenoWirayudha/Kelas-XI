package com.komputerkit.moview.ui.home.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import androidx.core.content.ContextCompat
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.util.loadThumbnail

class PopularMovieAdapter(
    private val movies: List<Movie>,
    private val onMovieClick: (Movie) -> Unit
) : RecyclerView.Adapter<PopularMovieAdapter.MovieViewHolder>() {

    inner class MovieViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val posterImage: ImageView = view.findViewById(R.id.iv_poster)
        val titleText: TextView = view.findViewById(R.id.tv_title)
        val starRating: com.komputerkit.moview.ui.common.StarRatingView = view.findViewById(R.id.star_rating)

        fun bind(movie: Movie) {
            titleText.text = movie.title ?: "Unknown"

            // Convert rating to stars (★★★★★)
            starRating.apply {
                displayMode = true
                starSizeDp = 14f
                starGapDp = 0f
                setColors(
                    ContextCompat.getColor(itemView.context, R.color.star_green),
                    ContextCompat.getColor(itemView.context, R.color.star_green_empty)
                )
            }
            starRating.rating = movie.averageRating ?: 0f
            starRating.visibility = if ((movie.averageRating ?: 0f) > 0f) View.VISIBLE else View.GONE

            // Load poster image with optimization
            posterImage.loadThumbnail(movie.posterUrl, movie.title)

            itemView.setOnClickListener {
                onMovieClick(movie)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MovieViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_popular_movie, parent, false)
        return MovieViewHolder(view)
    }

    override fun onBindViewHolder(holder: MovieViewHolder, position: Int) {
        holder.bind(movies[position])
    }

    override fun getItemCount(): Int = movies.size
}
