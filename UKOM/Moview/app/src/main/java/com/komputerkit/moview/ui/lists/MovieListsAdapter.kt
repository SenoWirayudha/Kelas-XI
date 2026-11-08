package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.ItemFilmListBinding
import com.komputerkit.moview.databinding.ItemListStripPosterBinding
import com.komputerkit.moview.util.loadProfilePhoto
import com.komputerkit.moview.util.loadThumbnail

/**
 * Row for the "Lists" screen on Movie Detail: the same layout as the My List
 * row (title + count + overlapping poster strip) plus the owner's avatar and
 * @username. Tapping the owner opens their profile; the row opens the list.
 */
class MovieListsAdapter(
    private val onClick: (FilmList) -> Unit,
    private val onOwnerClick: (FilmList) -> Unit
) : ListAdapter<FilmList, MovieListsAdapter.Holder>(Diff) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemFilmListBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(getItem(position))

    inner class Holder(private val binding: ItemFilmListBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(list: FilmList) {
            binding.tvTitle.text = list.title
            binding.tvCount.text = "${list.itemsCount} Films"

            val owner = list.ownerUsername
            val hasOwner = !owner.isNullOrBlank()
            binding.layoutOwner.visibility = if (hasOwner) View.VISIBLE else View.GONE
            if (hasOwner) {
                binding.tvOwner.text = "@$owner"
                // Same loader + default placeholder as the list detail header.
                binding.ivOwnerAvatar.loadProfilePhoto(list.ownerAvatarUrl)
                binding.ivOwnerAvatar.setOnClickListener { onOwnerClick(list) }
                binding.tvOwner.setOnClickListener { onOwnerClick(list) }
            } else {
                binding.ivOwnerAvatar.setOnClickListener(null)
                binding.tvOwner.setOnClickListener(null)
            }

            binding.layoutPosters.removeAllViews()
            val posters = list.posterUrls.ifEmpty { listOfNotNull(list.posterUrl) }.take(7)
            posters.forEach { url ->
                val poster = ItemListStripPosterBinding.inflate(
                    LayoutInflater.from(binding.root.context),
                    binding.layoutPosters,
                    false
                )
                poster.ivPoster.loadThumbnail(url, list.title)
                binding.layoutPosters.addView(poster.root)
            }
            binding.layoutPosters.visibility =
                if (posters.isEmpty()) LinearLayout.GONE else LinearLayout.VISIBLE

            binding.root.setOnClickListener { onClick(list) }
            // Long press has no action on this screen (no delete/edit here).
            binding.root.setOnLongClickListener(null)
        }
    }

    private object Diff : DiffUtil.ItemCallback<FilmList>() {
        override fun areItemsTheSame(oldItem: FilmList, newItem: FilmList) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: FilmList, newItem: FilmList) = oldItem == newItem
    }
}
