package com.komputerkit.moview.ui.diary

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.DiaryEntry
import com.komputerkit.moview.databinding.ItemDiaryEntryBinding
import com.komputerkit.moview.util.MovieActionsHelper

class DiaryAdapter(
    private val onEntryClick: (DiaryEntry) -> Unit,
    private val onLikeClick: (DiaryEntry) -> Unit,
    private val onMenuClick: (DiaryEntry) -> Unit,
    private val onPosterLongClick: ((DiaryEntry) -> Unit)? = null
) : ListAdapter<DiaryItem, RecyclerView.ViewHolder>(DiaryItemDiffCallback()) {

    companion object {
        private const val TYPE_HEADER = 0
        private const val TYPE_ENTRY = 1
    }

    override fun getItemViewType(position: Int): Int {
        return when (getItem(position)) {
            is DiaryItem.Header -> TYPE_HEADER
            is DiaryItem.Entry -> TYPE_ENTRY
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val binding = ItemDiaryEntryBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return when (viewType) {
            TYPE_HEADER -> HeaderViewHolder(binding)
            else -> EntryViewHolder(binding, onEntryClick, onLikeClick, onMenuClick, onPosterLongClick)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = getItem(position)) {
            is DiaryItem.Header -> (holder as HeaderViewHolder).bind(item.monthYear)
            is DiaryItem.Entry -> (holder as EntryViewHolder).bind(item.entry)
        }
    }

    class HeaderViewHolder(
        private val binding: ItemDiaryEntryBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(monthYear: String) {
            binding.tvMonthHeader.text = monthYear
            binding.tvMonthHeader.visibility = View.VISIBLE
            binding.entryContainer.visibility = View.GONE
        }
    }

    class EntryViewHolder(
        private val binding: ItemDiaryEntryBinding,
        private val onEntryClick: (DiaryEntry) -> Unit,
        private val onLikeClick: (DiaryEntry) -> Unit,
        private val onMenuClick: (DiaryEntry) -> Unit,
        private val onPosterLongClick: ((DiaryEntry) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(entry: DiaryEntry) {
            binding.tvMonthHeader.visibility = View.GONE
            binding.entryContainer.visibility = View.VISIBLE

            binding.tvTitle.text = entry.movie.title
            binding.tvYear.text = entry.movie.releaseYear.toString()
            binding.tvDate.text = entry.dateLabel

            Glide.with(binding.root.context)
                .load(entry.movie.posterUrl)
                .into(binding.ivPoster)

            // Set stars
            updateStars(entry.rating)

            // Show review icon if has review
            binding.icHasReview.visibility = if (entry.hasReview) View.VISIBLE else View.GONE

            // Show liked icon next to rating stars if liked
            binding.icLiked.visibility = if (entry.isLiked) View.VISIBLE else View.GONE

            // Show rewatch icon if this is a rewatch
            binding.icRewatched.visibility = if (entry.isRewatched) View.VISIBLE else View.GONE

            binding.entryContainer.setOnClickListener {
                onEntryClick(entry)
            }
            
            // Long press on poster to show movie actions
            binding.ivPoster.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = entry.movie,
                    isFromMovieDetail = false,
                    onGoToFilm = { movie -> onPosterLongClick?.invoke(entry) }
                )
                true
            }
        }

        private fun updateStars(rating: Int) {
            val stars = listOf(
                binding.star1,
                binding.star2,
                binding.star3,
                binding.star4,
                binding.star5
            )

            stars.forEachIndexed { index, star ->
                if (index < rating) {
                    star.setImageResource(R.drawable.ic_star_filled)
                } else {
                    star.setImageResource(R.drawable.ic_star_outline)
                }
            }
        }
    }

    private class DiaryItemDiffCallback : DiffUtil.ItemCallback<DiaryItem>() {
        override fun areItemsTheSame(oldItem: DiaryItem, newItem: DiaryItem): Boolean {
            return when {
                oldItem is DiaryItem.Header && newItem is DiaryItem.Header ->
                    oldItem.monthYear == newItem.monthYear
                oldItem is DiaryItem.Entry && newItem is DiaryItem.Entry ->
                    oldItem.entry.id == newItem.entry.id
                else -> false
            }
        }

        override fun areContentsTheSame(oldItem: DiaryItem, newItem: DiaryItem): Boolean {
            return oldItem == newItem
        }
    }
}

sealed class DiaryItem {
    data class Header(val monthYear: String) : DiaryItem()
    data class Entry(val entry: DiaryEntry) : DiaryItem()
}
