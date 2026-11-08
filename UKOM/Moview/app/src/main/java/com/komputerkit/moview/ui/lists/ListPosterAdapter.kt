package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.databinding.ItemListPosterBinding
import com.komputerkit.moview.databinding.ItemListPreviewMoreBinding
import com.komputerkit.moview.util.loadGridThumbnail

/**
 * Poster grid shared by Your List and the Buat List preview.
 *
 * - Uses [item_list_poster] (FrameLayout + poster + rank badge overlay) so the
 *   badge can sit half above the poster in both screens.
 * - Cell size comes from [PosterGridSizingDecoration]: identical width/height
 *   for every column, no per-item margin.
 * - Rank badges depend on the list type, not on the item, hence [showRanks].
 */
class ListPosterAdapter(
    private val spanCount: Int,
    private val onClick: (FilmListItem) -> Unit = {},
    private val onLongClick: (FilmListItem, View) -> Unit = { _, _ -> }
) : ListAdapter<PosterCell, RecyclerView.ViewHolder>(Diff) {

    var showRanks: Boolean = false
        set(value) {
            if (field == value) return
            field = value
            if (itemCount > 0) notifyItemRangeChanged(0, itemCount, PAYLOAD_RANKS)
        }

    override fun getItemViewType(position: Int) = when (getItem(position)) {
        is PosterCell.Film -> TYPE_FILM
        is PosterCell.More -> TYPE_MORE
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == TYPE_MORE) {
            MoreHolder(ItemListPreviewMoreBinding.inflate(inflater, parent, false))
        } else {
            FilmHolder(ItemListPosterBinding.inflate(inflater, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val cell = getItem(position)) {
            is PosterCell.Film -> (holder as FilmHolder).bind(cell.item)
            is PosterCell.More -> (holder as MoreHolder).bind(cell.count)
        }
    }

    override fun onBindViewHolder(
        holder: RecyclerView.ViewHolder,
        position: Int,
        payloads: MutableList<Any>
    ) {
        if (payloads.contains(PAYLOAD_RANKS) && holder is FilmHolder) {
            holder.bindRank((getItem(position) as PosterCell.Film).item)
            return
        }
        super.onBindViewHolder(holder, position, payloads)
    }

    inner class FilmHolder(private val binding: ItemListPosterBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: FilmListItem) {
            binding.ivPoster.loadGridThumbnail(item.posterUrl, item.title, spanCount)
            bindRank(item)

            binding.cardPoster.setOnClickListener { onClick(item) }
            binding.cardPoster.setOnLongClickListener { view ->
                onLongClick(item, view)
                true
            }
        }

        fun bindRank(item: FilmListItem) {
            // Half of the badge sits above the poster edge, half overlaps it.
            binding.tvRank.translationY = -binding.tvRank.layoutParams.height / 2f
            binding.tvRank.visibility = if (showRanks) View.VISIBLE else View.GONE
            binding.tvRank.text = item.position.toString()
        }
    }

    inner class MoreHolder(private val binding: ItemListPreviewMoreBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(count: Int) {
            binding.tvMore.text = "+$count"
            binding.root.setOnClickListener(null)
            binding.root.setOnLongClickListener(null)
        }
    }

    private object Diff : DiffUtil.ItemCallback<PosterCell>() {
        override fun areItemsTheSame(oldItem: PosterCell, newItem: PosterCell) = when {
            oldItem is PosterCell.Film && newItem is PosterCell.Film ->
                oldItem.item.movieId == newItem.item.movieId
            oldItem is PosterCell.More && newItem is PosterCell.More -> true
            else -> false
        }

        override fun areContentsTheSame(oldItem: PosterCell, newItem: PosterCell) = oldItem == newItem
    }

    private companion object {
        const val TYPE_FILM = 1
        const val TYPE_MORE = 2
        const val PAYLOAD_RANKS = "ranks"
    }
}
