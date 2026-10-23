package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemSearchHistoryBinding

class SearchHistoryAdapter(
    private val onKeywordClick: (String) -> Unit,
    private val onDeleteClick: (String) -> Unit
) : ListAdapter<String, SearchHistoryAdapter.HistoryViewHolder>(DIFF) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemSearchHistoryBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class HistoryViewHolder(
        private val binding: ItemSearchHistoryBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(keyword: String) {
            binding.tvKeyword.text = keyword
            binding.root.setOnClickListener { onKeywordClick(keyword) }
            binding.btnDelete.setOnClickListener { onDeleteClick(keyword) }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<String>() {
            override fun areItemsTheSame(oldItem: String, newItem: String) = oldItem == newItem
            override fun areContentsTheSame(oldItem: String, newItem: String) = oldItem == newItem
        }
    }
}
