package com.komputerkit.moview.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.PopupMenu
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Comment
import com.komputerkit.moview.databinding.ItemCommentBinding

class CommentAdapter(
    private val currentUserId: Int,
    private val onProfileClick: (Int) -> Unit,
    private val onReplyClick: (Comment) -> Unit,
    private val onDeleteClick: (Comment) -> Unit
) : ListAdapter<Comment, CommentAdapter.CommentViewHolder>(CommentDiffCallback()) {

    private var flattenedComments: List<Pair<Comment, Boolean>> = emptyList()

    override fun submitList(list: List<Comment>?) {
        // Flatten the nested comments list
        flattenedComments = list?.flatMap { comment ->
            val result = mutableListOf(Pair(comment, false)) // false = not a reply
            result.addAll(comment.replies.map { reply -> Pair(reply, true) }) // true = is a reply
            result
        } ?: emptyList()
        super.submitList(flattenedComments.map { it.first })
    }

    override fun getItemCount(): Int = flattenedComments.size

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CommentViewHolder {
        val binding = ItemCommentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CommentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CommentViewHolder, position: Int) {
        val (comment, isReply) = flattenedComments[position]
        holder.bind(comment, isReply)
    }

    inner class CommentViewHolder(private val binding: ItemCommentBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(comment: Comment, isReply: Boolean) {
            binding.apply {
                // Show/hide reply indicator
                if (isReply) {
                    replyLine.visibility = android.view.View.VISIBLE
                    root.setPaddingRelative(
                        root.context.resources.getDimensionPixelSize(R.dimen.reply_indent),
                        root.paddingTop,
                        root.paddingEnd,
                        root.paddingBottom
                    )
                } else {
                    replyLine.visibility = android.view.View.GONE
                    root.setPaddingRelative(
                        root.context.resources.getDimensionPixelSize(R.dimen.comment_padding),
                        root.paddingTop,
                        root.paddingEnd,
                        root.paddingBottom
                    )
                }
                
                Glide.with(ivProfile)
                    .load(comment.userAvatar)
                    .placeholder(R.color.dark_card)
                    .circleCrop()
                    .into(ivProfile)

                tvUsername.text = comment.username
                tvTime.text = comment.timeAgo
                
                // Render HTML formatting (comments are stored as HTML)
                tvCommentText.text = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    android.text.Html.fromHtml(comment.commentText, android.text.Html.FROM_HTML_MODE_LEGACY)
                } else {
                    @Suppress("DEPRECATION")
                    android.text.Html.fromHtml(comment.commentText)
                }
                tvCommentText.movementMethod = android.text.method.LinkMovementMethod.getInstance()

                cardProfile.setOnClickListener {
                    onProfileClick(comment.userId)
                }

                tvReplyButton.setOnClickListener {
                    onReplyClick(comment)
                }
                
                // Show menu icon only for own comments
                if (comment.userId == currentUserId) {
                    ivMenu.visibility = View.VISIBLE
                    ivMenu.setOnClickListener { view ->
                        showPopupMenu(view, comment)
                    }
                } else {
                    ivMenu.visibility = View.GONE
                    ivMenu.setOnClickListener(null)
                }
            }
        }
        
        private fun showPopupMenu(view: View, comment: Comment) {
            val popup = PopupMenu(view.context, view)
            popup.menuInflater.inflate(R.menu.menu_comment, popup.menu)
            popup.setOnMenuItemClickListener { menuItem ->
                when (menuItem.itemId) {
                    R.id.action_delete -> {
                        onDeleteClick(comment)
                        true
                    }
                    else -> false
                }
            }
            popup.show()
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
