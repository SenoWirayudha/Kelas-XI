package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.ItemFilmListBinding
import com.komputerkit.moview.databinding.ItemListStripPosterBinding
import com.komputerkit.moview.util.loadThumbnail

/** My List row: title + count + overlapping poster strip (max 7). */
class MyListsAdapter(
    private val onClick: (FilmList) -> Unit,
    private val onLongClick: (FilmList) -> Unit
) : ListAdapter<FilmList, MyListsAdapter.Holder>(Diff) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemFilmListBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(getItem(position))

    inner class Holder(private val binding: ItemFilmListBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(list: FilmList) {
            binding.tvTitle.text = list.title
            binding.tvCount.text = "${list.itemsCount} Films"

            binding.layoutPosters.removeAllViews()

            val posters = list.posterUrls.ifEmpty {
                listOfNotNull(list.posterUrl)
            }.take(7)

            posters.forEach { url ->
                val poster = ItemListStripPosterBinding.inflate(
                    LayoutInflater.from(binding.root.context),
                    binding.layoutPosters,
                    false
                )
                poster.ivPoster.loadThumbnail(url, list.title)
                binding.layoutPosters.addView(poster.root)
            }

            if (posters.isEmpty()) {
                binding.layoutPosters.visibility = LinearLayout.GONE
            } else {
                binding.layoutPosters.visibility = LinearLayout.VISIBLE
            }

            binding.root.setOnClickListener { onClick(list) }
            binding.root.setOnLongClickListener {
                onLongClick(list)
                true
            }
        }
    }

    private object Diff : DiffUtil.ItemCallback<FilmList>() {
        override fun areItemsTheSame(oldItem: FilmList, newItem: FilmList) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: FilmList, newItem: FilmList) = oldItem == newItem
    }
}
