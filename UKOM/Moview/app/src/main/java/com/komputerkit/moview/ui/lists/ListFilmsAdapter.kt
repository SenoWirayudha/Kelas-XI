package com.komputerkit.moview.ui.lists

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.databinding.ItemListFilmBinding
import com.komputerkit.moview.util.loadThumbnail

/**
 * Film row inside a list. Ranking lists show a number, plain lists hide it.
 * A plain adapter (not ListAdapter) because drag & drop mutates the order.
 */
class ListFilmsAdapter(
    private val ranked: Boolean,
    private val draggable: Boolean,
    private val onRemove: (FilmListItem) -> Unit,
    private val onArtwork: (FilmListItem) -> Unit,
    private val onDragStart: (RecyclerView.ViewHolder) -> Unit,
    /** The editor has no list yet, so the per-film artwork button is hidden there. */
    private val showArtwork: Boolean = true
) : RecyclerView.Adapter<ListFilmsAdapter.Holder>() {

    private val items = mutableListOf<FilmListItem>()

    val currentItems: List<FilmListItem> get() = items.toList()

    @SuppressLint("NotifyDataSetChanged")
    fun submit(newItems: List<FilmListItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    /** Applies a drag result and renumbers positions 1..n. */
    fun moveItem(from: Int, to: Int) {
        if (from !in items.indices || to !in items.indices) return

        val moved = items.removeAt(from)
        items.add(to, moved)

        for (index in items.indices) {
            items[index] = items[index].copy(position = index + 1)
        }
        notifyItemMoved(from, to)
        notifyItemRangeChanged(0, items.size)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemListFilmBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(items[position])

    inner class Holder(private val binding: ItemListFilmBinding) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: FilmListItem) {
            binding.tvPosition.visibility = if (ranked) View.VISIBLE else View.GONE
            binding.tvPosition.text = item.position.toString()

            binding.ivDrag.visibility = if (draggable) View.VISIBLE else View.GONE
            binding.ivDrag.setOnTouchListener { _, _ ->
                if (draggable) onDragStart(this@Holder)
                false
            }

            binding.tvTitle.text = item.title.orEmpty()
            binding.tvYear.text = item.releaseYear?.toString().orEmpty()
            binding.tvYear.visibility = if (item.releaseYear == null) View.GONE else View.VISIBLE

            binding.ivPoster.loadThumbnail(item.posterUrl, item.title)

            binding.btnArtwork.visibility = if (draggable && showArtwork) View.VISIBLE else View.GONE
            binding.btnRemove.visibility = if (draggable) View.VISIBLE else View.GONE
            binding.btnArtwork.setOnClickListener { onArtwork(item) }
            binding.btnRemove.setOnClickListener { onRemove(item) }
        }
    }
}
