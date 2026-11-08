package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.databinding.ItemListGridBinding
import com.komputerkit.moview.util.loadGridThumbnail

/**
 * Poster grid for lists. Reuses the app's standard film grid cell
 * (item_film_grid) so radius, margins and poster ratio match Profile/Search.
 *
 * ListAdapter so large lists only re-bind the cells that actually changed.
 */
class PosterGridAdapter(
    private val showRanks: () -> Boolean,
    private val onClick: (FilmListItem) -> Unit = {},
    private val onLongClick: (FilmListItem, View) -> Unit = { _, _ -> }
) : ListAdapter<FilmListItem, PosterGridAdapter.Holder>(Diff) {

    /** Columns of the grid using this adapter (drives thumbnail decode size). */
    var spanCount: Int = 4

    /** Diffs against the current items; [onCommitted] runs after the change lands. */
    fun submit(newItems: List<FilmListItem>, onCommitted: (() -> Unit)? = null) {
        submitList(newItems.toList(), onCommitted)
    }

    /**
     * Rank badges depend on the caller's toggle, not on item content, so a
     * toggle change needs an explicit re-bind of the visible cells.
     */
    fun refreshRankBadges() {
        if (itemCount > 0) notifyItemRangeChanged(0, itemCount)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemListGridBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(getItem(position))

    inner class Holder(private val binding: ItemListGridBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: FilmListItem) {
            val card = binding.posterCard
            // Small, cached decode: never the full-resolution source.
            card.ivPoster.loadGridThumbnail(item.posterUrl, item.title, spanCount)

            // The shared cell shows star ratings; lists don't have one.
            card.ratingContainer.visibility = View.GONE

            val ranked = showRanks()
            binding.tvRank.visibility = if (ranked) View.VISIBLE else View.GONE
            binding.tvRank.text = item.position.toString()

            // item_film_grid puts a clickable poster_container overlay above the
            // image; attach the listeners there (same cell as Profile/Search).
            binding.posterCard.posterContainer.setOnClickListener { onClick(item) }
            binding.posterCard.posterContainer.setOnLongClickListener { view ->
                onLongClick(item, view)
                true
            }
        }
    }

    private object Diff : DiffUtil.ItemCallback<FilmListItem>() {
        override fun areItemsTheSame(oldItem: FilmListItem, newItem: FilmListItem) =
            oldItem.movieId == newItem.movieId

        override fun areContentsTheSame(oldItem: FilmListItem, newItem: FilmListItem) =
            oldItem == newItem
    }
}
