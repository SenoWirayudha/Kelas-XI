package com.komputerkit.earningapp.widgets

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.earningapp.R
import com.komputerkit.earningapp.screens.Category

class CategoryAdapter(
    private val categories: List<Category>,
    private val onCategoryClick: (Category) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder>() {
    
    inner class CategoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val cardView: CardView = itemView.findViewById(R.id.categoryCard)
        val iconTextView: TextView = itemView.findViewById(R.id.categoryIcon)
        val nameTextView: TextView = itemView.findViewById(R.id.categoryName)
        
        fun bind(category: Category) {
            iconTextView.text = category.icon
            nameTextView.text = category.name
            
            // Set card color
            try {
                cardView.setCardBackgroundColor(Color.parseColor(category.color))
            } catch (e: Exception) {
                cardView.setCardBackgroundColor(Color.parseColor("#2196F3"))
            }
            
            // Set click listener
            itemView.setOnClickListener {
                onCategoryClick(category)
            }
        }
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_category, parent, false)
        return CategoryViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.bind(categories[position])
    }
    
    override fun getItemCount() = categories.size
}
