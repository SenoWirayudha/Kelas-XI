package com.komputerkit.wavesoffood.ui.cart

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.model.CartItem
import com.komputerkit.wavesoffood.databinding.ItemCartBinding

class CartAdapter(
    private val onQuantityChanged: (CartItem, Int) -> Unit,
    private val onDeleteClick: (CartItem) -> Unit
) : ListAdapter<CartItem, CartAdapter.CartViewHolder>(CartDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CartViewHolder {
        val binding = ItemCartBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return CartViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CartViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CartViewHolder(
        private val binding: ItemCartBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: CartItem) {
            binding.apply {
                tvName.text = item.name
                tvPrice.text = root.context.getString(R.string.currency, item.price.toString())
                tvQuantity.text = item.quantity.toString()

                Glide.with(root.context)
                    .load(item.imageUrl)
                    .centerCrop()
                    .into(ivFood)

                btnMinus.setOnClickListener {
                    if (item.quantity > 1) {
                        onQuantityChanged(item, item.quantity - 1)
                    }
                }

                btnPlus.setOnClickListener {
                    onQuantityChanged(item, item.quantity + 1)
                }

                btnDelete.setOnClickListener {
                    onDeleteClick(item)
                }
            }
        }
    }

    private class CartDiffCallback : DiffUtil.ItemCallback<CartItem>() {
        override fun areItemsTheSame(oldItem: CartItem, newItem: CartItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: CartItem, newItem: CartItem): Boolean {
            return oldItem == newItem
        }
    }
}
