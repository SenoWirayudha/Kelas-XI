package com.komputerkit.moview.ui.social

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.UserProfile
import com.komputerkit.moview.databinding.ItemUserBinding

class UserAdapter(
    private val onUserClick: (UserProfile) -> Unit
) : ListAdapter<UserProfile, UserAdapter.UserViewHolder>(UserDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val binding = ItemUserBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return UserViewHolder(binding, onUserClick)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class UserViewHolder(
        private val binding: ItemUserBinding,
        private val onUserClick: (UserProfile) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(user: UserProfile) {
            binding.tvUsername.text = user.username
            
            if (user.bio != null && user.bio.isNotEmpty()) {
                binding.tvBio.text = user.bio
                binding.tvBio.visibility = android.view.View.VISIBLE
            } else {
                binding.tvBio.visibility = android.view.View.GONE
            }

            Glide.with(binding.root.context)
                .load(user.avatarUrl)
                .placeholder(R.color.dark_card)
                .circleCrop()
                .into(binding.ivAvatar)

            binding.root.setOnClickListener {
                onUserClick(user)
            }

            binding.ivAvatar.setOnClickListener {
                onUserClick(user)
            }
        }
    }

    private class UserDiffCallback : DiffUtil.ItemCallback<UserProfile>() {
        override fun areItemsTheSame(oldItem: UserProfile, newItem: UserProfile): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: UserProfile, newItem: UserProfile): Boolean {
            return oldItem == newItem
        }
    }
}
