package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemSearchStudioBinding

class SearchStudioAdapter(
    private val onStudioClick: (SearchStudio) -> Unit
) : RecyclerView.Adapter<SearchStudioAdapter.SearchStudioViewHolder>() {
    
    private var studios: List<SearchStudio> = emptyList()
    
    fun submitList(list: List<SearchStudio>) {
        studios = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchStudioViewHolder {
        val binding = ItemSearchStudioBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SearchStudioViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: SearchStudioViewHolder, position: Int) {
        holder.bind(studios[position])
    }
    
    override fun getItemCount(): Int = studios.size
    
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
}
