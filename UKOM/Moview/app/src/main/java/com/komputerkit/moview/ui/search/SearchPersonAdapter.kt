package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemSearchPersonBinding
import com.komputerkit.moview.util.loadAvatar

class SearchPersonAdapter(
    private val onPersonClick: (SearchPerson) -> Unit
) : ListAdapter<SearchPerson, SearchPersonAdapter.SearchPersonViewHolder>(DIFF) {
    

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchPersonViewHolder {
        val binding = ItemSearchPersonBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SearchPersonViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: SearchPersonViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class SearchPersonViewHolder(
        private val binding: ItemSearchPersonBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(person: SearchPerson) {
            binding.ivAvatar.loadAvatar(person.avatarUrl)
            
            binding.tvName.text = person.name
            binding.tvRole.text = person.role
            binding.tvKnownFor.text = person.knownFor
            
            binding.root.setOnClickListener {
                onPersonClick(person)
            }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<SearchPerson>() {
            override fun areItemsTheSame(oldItem: SearchPerson, newItem: SearchPerson) =
                oldItem.id == newItem.id

            override fun areContentsTheSame(oldItem: SearchPerson, newItem: SearchPerson) =
                oldItem == newItem
        }
    }
}
