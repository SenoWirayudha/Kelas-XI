package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.ItemFilmListBinding
import com.komputerkit.moview.util.loadThumbnail

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
            binding.tvDescription.text = list.description.orEmpty()
            binding.tvDescription.visibility = if (list.description.isNullOrBlank()) View.GONE else View.VISIBLE

            val typeLabel = if (list.isRanked) "Ranking" else "Biasa"
            val visibilityLabel = if (list.isPrivate) "Privat" else "Publik"
            binding.tvMeta.text = "${list.itemsCount} film • $typeLabel • $visibilityLabel"

            binding.ivPoster.loadThumbnail(list.posterUrl, list.title)

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
