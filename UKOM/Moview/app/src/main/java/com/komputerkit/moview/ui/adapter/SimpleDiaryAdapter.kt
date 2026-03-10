package com.komputerkit.moview.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Diary
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.ItemDiarySimpleBinding
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadPoster

class SimpleDiaryAdapter(
    private val onDiaryClick: (reviewOrDiaryId: Int, isLog: Boolean, diaryId: Int) -> Unit,
    private val onChangePoster: ((diary: Diary) -> Unit)? = null,
    private val onLogFilm: ((movieId: Int) -> Unit)? = null
) : ListAdapter<Diary, SimpleDiaryAdapter.DiaryViewHolder>(DiaryDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DiaryViewHolder {
        val binding = ItemDiarySimpleBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return DiaryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DiaryViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class DiaryViewHolder(
        private val binding: ItemDiarySimpleBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(diary: Diary) {
            binding.apply {
                // Load poster
                ivPoster.loadPoster(diary.poster_path)

                // Set title and year
                tvTitle.text = diary.title
                tvYear.text = diary.year.toString()

                // Set watched date as badge (show day number like diary screen)
                tvDate.text = try {
                    diary.watched_at.substring(8, 10).trimStart('0').ifEmpty { "1" }
                } catch (e: Exception) { diary.watched_at }

                // Update star icons (matching diary screen style)
                val stars = listOf(star1, star2, star3, star4, star5)
                stars.forEachIndexed { index, star ->
                    star.setImageResource(
                        if (index < diary.rating) R.drawable.ic_star_filled
                        else R.drawable.ic_star_outline
                    )
                }

                // Show rewatch icon if rewatched
                icRewatched.visibility = if (diary.is_rewatched) View.VISIBLE else View.GONE

                // Show heart icon if liked
                icLiked.visibility = if (diary.is_liked) View.VISIBLE else View.GONE

                // Show review icon if entry is a review
                icHasReview.visibility = if (diary.type == "review") View.VISIBLE else View.GONE

                // Click listener: match diary screen logic exactly
                // If entry has a review, navigate to that review
                // Otherwise navigate as log entry using diary_id
                root.setOnClickListener {
                    if (diary.review_id > 0) {
                        onDiaryClick(diary.review_id, false, diary.diary_id)
                    } else {
                        onDiaryClick(diary.diary_id, true, diary.diary_id)
                    }
                }

                ivPoster.setOnLongClickListener { view ->
                    val movie = Movie(
                        id = diary.movie_id,
                        title = diary.title,
                        posterUrl = diary.poster_path,
                        averageRating = null,
                        genre = null,
                        releaseYear = diary.year,
                        description = null
                    )
                    MovieActionsHelper.showMovieActionsBottomSheet(
                        context = view.context,
                        movie = movie,
                        isFromMovieDetail = false,
                        onLogFilm = if (onLogFilm != null) { _ -> onLogFilm.invoke(diary.movie_id) } else null,
                        onChangePoster = if (onChangePoster != null) { _ -> onChangePoster.invoke(diary) } else null
                    )
                    true
                }
            }
        }
    }

    class DiaryDiffCallback : DiffUtil.ItemCallback<Diary>() {
        override fun areItemsTheSame(oldItem: Diary, newItem: Diary): Boolean {
            return oldItem.diary_id == newItem.diary_id
        }

        override fun areContentsTheSame(oldItem: Diary, newItem: Diary): Boolean {
            return oldItem == newItem
        }
    }
}
