package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.ItemAddToListBinding

/** Multi-select list rows for "Add to List" (title + film count only). */
class AddToListAdapter : ListAdapter<FilmList, AddToListAdapter.Holder>(Diff) {

    private val selectedIds = mutableSetOf<Int>()

    fun selectedListIds(): List<Int> = selectedIds.toList()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemAddToListBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(getItem(position))

    inner class Holder(private val binding: ItemAddToListBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(list: FilmList) {
            binding.tvTitle.text = list.title
            binding.tvCount.text = "${list.itemsCount} Films"

            // Already in this list: show it, but never allow a second add.
            val alreadyAdded = list.containsMovie
            binding.tvAlreadyAdded.visibility = if (alreadyAdded) View.VISIBLE else View.GONE
            binding.ivSelected.visibility = when {
                alreadyAdded -> View.GONE
                selectedIds.contains(list.id) -> View.VISIBLE
                else -> View.INVISIBLE
            }
            binding.root.isEnabled = !alreadyAdded
            binding.rowContent.isEnabled = !alreadyAdded
            binding.rowContent.alpha = if (alreadyAdded) 0.55f else 1f
            binding.tvAlreadyAdded.alpha = 1f

            binding.rowContent.setOnClickListener {
                if (list.containsMovie) return@setOnClickListener
                if (selectedIds.contains(list.id)) {
                    selectedIds.remove(list.id)
                } else {
                    selectedIds.add(list.id)
                }
                val position = bindingAdapterPosition
                if (position != RecyclerView.NO_POSITION) notifyItemChanged(position)
            }
        }
    }

    private object Diff : DiffUtil.ItemCallback<FilmList>() {
        override fun areItemsTheSame(oldItem: FilmList, newItem: FilmList) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: FilmList, newItem: FilmList) = oldItem == newItem
    }
}
