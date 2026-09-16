package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.model.CastMember
import com.komputerkit.moview.databinding.ItemCastMemberBinding
import com.komputerkit.moview.databinding.ItemCastMemberListBinding
import com.komputerkit.moview.util.loadAvatar

class CastAdapter(
    private val onCastClick: (CastMember) -> Unit = {}
) : ListAdapter<CastMember, RecyclerView.ViewHolder>(CastDiffCallback()) {

    var isListView = false
        set(value) {
            if (field != value) {
                field = value
                notifyDataSetChanged()
            }
        }

    override fun getItemViewType(position: Int): Int = if (isListView) VIEW_LIST else VIEW_GRID

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == VIEW_LIST) {
            ListViewHolder(ItemCastMemberListBinding.inflate(inflater, parent, false))
        } else {
            GridViewHolder(ItemCastMemberBinding.inflate(inflater, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is ListViewHolder -> holder.bind(getItem(position), onCastClick)
            is GridViewHolder -> holder.bind(getItem(position), onCastClick)
        }
    }

    class GridViewHolder(private val binding: ItemCastMemberBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(cast: CastMember, onClick: (CastMember) -> Unit) {
            binding.tvCastName.text = cast.name
            binding.tvCharacterName.text = cast.character
            binding.ivCastPhoto.loadAvatar(cast.photoUrl)
            binding.root.setOnClickListener { onClick(cast) }
        }
    }

    class ListViewHolder(private val binding: ItemCastMemberListBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(cast: CastMember, onClick: (CastMember) -> Unit) {
            binding.tvCastName.text = cast.name
            binding.tvCharacterName.text = cast.character
            binding.ivCastPhoto.loadAvatar(cast.photoUrl)
            binding.root.setOnClickListener { onClick(cast) }
        }
    }

    private class CastDiffCallback : DiffUtil.ItemCallback<CastMember>() {
        override fun areItemsTheSame(oldItem: CastMember, newItem: CastMember) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: CastMember, newItem: CastMember) = oldItem == newItem
    }

    companion object {
        private const val VIEW_GRID = 0
        private const val VIEW_LIST = 1
    }
}
