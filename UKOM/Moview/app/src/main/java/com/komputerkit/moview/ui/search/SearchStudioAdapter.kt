package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemSearchStudioBinding

class SearchStudioAdapter(
    private val onStudioClick: (SearchStudio) -> Unit
) : ListAdapter<SearchStudio, SearchStudioAdapter.SearchStudioViewHolder>(DIFF) {
    

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchStudioViewHolder {
        val binding = ItemSearchStudioBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SearchStudioViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: SearchStudioViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class SearchStudioViewHolder(
        private val binding: ItemSearchStudioBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(studio: SearchStudio) {
            binding.chipStudio.text = studio.name
            
            binding.chipStudio.setOnClickListener {
                onStudioClick(studio)
            }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<SearchStudio>() {
            override fun areItemsTheSame(oldItem: SearchStudio, newItem: SearchStudio) =
                oldItem.id == newItem.id

            override fun areContentsTheSame(oldItem: SearchStudio, newItem: SearchStudio) =
                oldItem == newItem
        }
    }
}
