package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemSearchPersonBinding
import com.komputerkit.moview.util.loadAvatar

class SearchPersonAdapter(
    private val onPersonClick: (SearchPerson) -> Unit
) : RecyclerView.Adapter<SearchPersonAdapter.SearchPersonViewHolder>() {
    

    private var people: List<SearchPerson> = emptyList()
    
    fun submitList(list: List<SearchPerson>) {
        people = list
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchPersonViewHolder {
        val binding = ItemSearchPersonBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SearchPersonViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: SearchPersonViewHolder, position: Int) {
        holder.bind(people[position])
    }
    
    override fun getItemCount(): Int = people.size
    
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
}
