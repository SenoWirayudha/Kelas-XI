package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.databinding.ItemListGridBinding
import com.komputerkit.moview.util.loadThumbnail

/**
 * Poster grid for lists. Reuses the app's standard film grid cell
 * (item_film_grid) so radius, margins and poster ratio match Profile/Search.
 */
class PosterGridAdapter(
    private val showRanks: () -> Boolean,
    private val onClick: (FilmListItem) -> Unit = {},
    private val onLongClick: (FilmListItem, View) -> Unit = { _, _ -> }
) : RecyclerView.Adapter<PosterGridAdapter.Holder>() {

    private val items = mutableListOf<FilmListItem>()

    fun submit(newItems: List<FilmListItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemListGridBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(items[position])

    inner class Holder(private val binding: ItemListGridBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: FilmListItem) {
            val card = binding.posterCard
            card.ivPoster.loadThumbnail(item.posterUrl, item.title)

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
}
