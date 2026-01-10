package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.model.CastMember
import com.komputerkit.moview.databinding.ItemCastMemberBinding

class CastAdapter(
    private val onCastClick: (CastMember) -> Unit = {}
) : ListAdapter<CastMember, CastAdapter.CastViewHolder>(CastDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CastViewHolder {
        val binding = ItemCastMemberBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return CastViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CastViewHolder, position: Int) {
        holder.bind(getItem(position), onCastClick)
    }

    class CastViewHolder(
        private val binding: ItemCastMemberBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(cast: CastMember, onClick: (CastMember) -> Unit) {
            binding.tvCastName.text = cast.name
            binding.tvCharacterName.text = cast.character
            
            Glide.with(binding.root.context)
                .load(cast.photoUrl)
                .circleCrop()
                .into(binding.ivCastPhoto)
            
            binding.root.setOnClickListener {
                onClick(cast)
            }
        }
    }

    private class CastDiffCallback : DiffUtil.ItemCallback<CastMember>() {
        override fun areItemsTheSame(oldItem: CastMember, newItem: CastMember): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: CastMember, newItem: CastMember): Boolean {
            return oldItem == newItem
        }
    }
}
