package com.komputerkit.moview.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Comment
import com.komputerkit.moview.databinding.ItemCommentBinding

class CommentAdapter(
    private val onProfileClick: (Int) -> Unit,
    private val onLikeClick: (Comment) -> Unit
) : ListAdapter<Comment, CommentAdapter.CommentViewHolder>(CommentDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CommentViewHolder {
        val binding = ItemCommentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CommentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CommentViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CommentViewHolder(private val binding: ItemCommentBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(comment: Comment) {
            binding.apply {
                Glide.with(ivProfile)
                    .load(comment.userAvatar)
                    .placeholder(R.color.dark_card)
                    .circleCrop()
                    .into(ivProfile)

                tvUsername.text = comment.username
                tvTime.text = comment.timeAgo
                tvCommentText.text = comment.commentText
                tvLikeCount.text = formatCount(comment.likeCount)

                // Update like icon
                if (comment.isLiked) {
                    ivLikeIcon.setImageResource(R.drawable.ic_heart_filled)
                    ivLikeIcon.setColorFilter(itemView.context.getColor(R.color.pink_like))
                } else {
                    ivLikeIcon.setImageResource(R.drawable.ic_heart_outline)
                    ivLikeIcon.setColorFilter(itemView.context.getColor(R.color.text_secondary))
                }

                cardProfile.setOnClickListener {
                    onProfileClick(comment.userId)
                }

                layoutActions.setOnClickListener {
                    onLikeClick(comment)
                }

                tvReplyButton.setOnClickListener {
                    // TODO: Handle reply
                }
            }
        }

        private fun formatCount(count: Int): String {
            return when {
                count >= 1000 -> String.format("%.1fk", count / 1000.0)
                else -> count.toString()
            }
        }
    }

    class CommentDiffCallback : DiffUtil.ItemCallback<Comment>() {
        override fun areItemsTheSame(oldItem: Comment, newItem: Comment): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Comment, newItem: Comment): Boolean {
            return oldItem == newItem
        }
    }
}
