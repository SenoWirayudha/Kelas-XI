package com.komputerkit.socialmediaapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.model.SearchHistory
import com.komputerkit.socialmediaapp.model.SearchType

class SearchHistoryAdapter(
    private var searchHistory: List<SearchHistory>,
    private val onHistoryClick: (SearchHistory) -> Unit,
    private val onDeleteClick: (SearchHistory) -> Unit
) : RecyclerView.Adapter<SearchHistoryAdapter.HistoryViewHolder>() {

    inner class HistoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val iconImageView: ImageView = itemView.findViewById(R.id.historyIcon)
        private val queryTextView: TextView = itemView.findViewById(R.id.historyQuery)
        private val deleteButton: ImageView = itemView.findViewById(R.id.deleteButton)

        fun bind(history: SearchHistory) {
            queryTextView.text = if (history.type == SearchType.HASHTAG) "#${history.query}" else history.query
            
            iconImageView.setImageResource(
                if (history.type == SearchType.HASHTAG) R.drawable.ic_hashtag else R.drawable.ic_search
            )
            
            itemView.setOnClickListener {
                onHistoryClick(history)
            }
            
            deleteButton.setOnClickListener {
                onDeleteClick(history)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_search_history, parent, false)
        return HistoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(searchHistory[position])
    }

    override fun getItemCount(): Int = searchHistory.size

    fun updateHistory(newHistory: List<SearchHistory>) {
        searchHistory = newHistory
        notifyDataSetChanged()
    }
}
