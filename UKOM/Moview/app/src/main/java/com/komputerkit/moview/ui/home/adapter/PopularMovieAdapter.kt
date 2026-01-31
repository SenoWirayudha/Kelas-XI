package com.komputerkit.moview.ui.home.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
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
        val ratingText: TextView = view.findViewById(R.id.tv_rating)

        fun bind(movie: Movie) {
            titleText.text = movie.title
            
            // Convert rating to stars (★★★★★)
            val stars = getStarsFromRating(movie.averageRating)
            ratingText.text = stars
            
            // Load poster image with optimization
            posterImage.loadThumbnail(movie.posterUrl)
            
            itemView.setOnClickListener {
                onMovieClick(movie)
            }
        }
        
        private fun getStarsFromRating(rating: Float): String {
            val fullStars = rating.toInt()
            val halfStar = if (rating - fullStars >= 0.5f) 1 else 0
            val emptyStars = 5 - fullStars - halfStar
            
            return "★".repeat(fullStars) + 
                   "½".repeat(halfStar).replace("½", "★") + 
                   "☆".repeat(emptyStars)
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
