package com.komputerkit.moview.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ItemSearchUserBinding

class SearchUserAdapter(
    private val onUserClick: (SearchUser) -> Unit
) : ListAdapter<SearchUser, SearchUserAdapter.SearchUserViewHolder>(DIFF) {


    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchUserViewHolder {
        val binding = ItemSearchUserBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SearchUserViewHolder(binding)
    }

    override fun onBindViewHolder(holder: SearchUserViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class SearchUserViewHolder(
        private val binding: ItemSearchUserBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(user: SearchUser) {
            binding.apply {
                tvUsername.text = user.username
                tvFullName.text = user.fullName
                tvStats.text = "${user.filmsCount} films • ${user.reviewsCount} reviews"
                
                // Load avatar
                Glide.with(binding.root.context)
                    .load(user.avatarUrl)
                    .placeholder(R.drawable.ic_default_profile)
                    .error(R.drawable.ic_default_profile)
                    .into(ivAvatar)
                
                root.setOnClickListener {
                    onUserClick(user)
                }
            }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<SearchUser>() {
            override fun areItemsTheSame(oldItem: SearchUser, newItem: SearchUser) =
                oldItem.id == newItem.id

            override fun areContentsTheSame(oldItem: SearchUser, newItem: SearchUser) =
                oldItem == newItem
        }
    }
}
