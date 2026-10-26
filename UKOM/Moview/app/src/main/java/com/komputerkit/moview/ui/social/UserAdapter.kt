package com.komputerkit.moview.ui.social

import android.content.res.ColorStateList
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.UserProfile
import com.komputerkit.moview.databinding.ItemUserBinding
import com.komputerkit.moview.util.loadProfilePhoto

class UserAdapter(
    private val onUserClick: (UserProfile) -> Unit,
    /** Toggles follow state for the tapped row; return the new state. */
    private val onFollowToggle: ((UserProfile) -> Unit)? = null
) : ListAdapter<UserProfile, UserAdapter.UserViewHolder>(UserDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val binding = ItemUserBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return UserViewHolder(binding, onUserClick, onFollowToggle)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class UserViewHolder(
        private val binding: ItemUserBinding,
        private val onUserClick: (UserProfile) -> Unit,
        private val onFollowToggle: ((UserProfile) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(user: UserProfile) {
            binding.tvUsername.text = user.username

            if (user.bio != null && user.bio.isNotEmpty()) {
                binding.tvBio.text = user.bio
                binding.tvBio.visibility = View.VISIBLE
            } else {
                binding.tvBio.visibility = View.GONE
            }

            binding.ivAvatar.loadProfilePhoto(user.avatarUrl)

            // Follow / Following pill. Hidden for the signed-in user's own row.
            if (onFollowToggle == null || user.isMyself) {
                binding.btnFollow.visibility = View.GONE
            } else {
                binding.btnFollow.visibility = View.VISIBLE
                val context = binding.root.context
                if (user.isFollowing) {
                    binding.btnFollow.text = "Following"
                    binding.btnFollow.setTextColor(
                        ContextCompat.getColor(context, R.color.text_secondary)
                    )
                    binding.btnFollow.strokeColor =
                        ColorStateList.valueOf(ContextCompat.getColor(context, R.color.input_border))
                } else {
                    binding.btnFollow.text = "Follow"
                    binding.btnFollow.setTextColor(
                        ContextCompat.getColor(context, R.color.accent_blue)
                    )
                    binding.btnFollow.strokeColor =
                        ColorStateList.valueOf(ContextCompat.getColor(context, R.color.accent_blue))
                }
                binding.btnFollow.setOnClickListener { onFollowToggle.invoke(user) }
            }

            binding.root.setOnClickListener { onUserClick(user) }
            binding.ivAvatar.setOnClickListener { onUserClick(user) }
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
