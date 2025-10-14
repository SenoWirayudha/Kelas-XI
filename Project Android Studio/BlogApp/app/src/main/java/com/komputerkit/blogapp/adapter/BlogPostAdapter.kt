package com.komputerkit.blogapp.adapter

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.blogapp.R
import com.komputerkit.blogapp.data.BlogPost
import com.komputerkit.blogapp.databinding.ItemBlogPostBinding
import com.komputerkit.blogapp.utils.ImageUtils
import java.text.SimpleDateFormat
import java.util.*

class BlogPostAdapter(
    private val onItemClick: (BlogPost) -> Unit,
    private val onLikeClick: (BlogPost) -> Unit,
    private val onSaveClick: (BlogPost) -> Unit,
    private val onEditClick: ((BlogPost) -> Unit)? = null,
    private val onDeleteClick: ((BlogPost) -> Unit)? = null,
    private val currentUserId: String?
) : ListAdapter<BlogPost, BlogPostAdapter.BlogPostViewHolder>(BlogPostDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BlogPostViewHolder {
        val binding = ItemBlogPostBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return BlogPostViewHolder(binding)
    }

    override fun onBindViewHolder(holder: BlogPostViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class BlogPostViewHolder(
        private val binding: ItemBlogPostBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        init {
            binding.root.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemClick(getItem(position))
                }
            }
            
            binding.btnLike.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onLikeClick(getItem(position))
                }
            }
            
            binding.btnSave.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onSaveClick(getItem(position))
                }
            }

            binding.btnEditPost.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onEditClick?.invoke(getItem(position))
                }
            }

            binding.btnDeletePost.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onDeleteClick?.invoke(getItem(position))
                }
            }
        }

        fun bind(post: BlogPost) {
            binding.apply {
                tvTitle.text = post.title
                tvAuthor.text = post.authorName
                tvExcerpt.text = post.getDisplayExcerpt()
                
                // Load author profile image
                Log.d("BlogAdapter", "Post ${post.title.take(20)}... - Author: ${post.authorName}")
                Log.d("BlogAdapter", "Profile image: ${if (post.authorProfileImage.isNullOrEmpty()) "EMPTY" else "HAS DATA (${post.authorProfileImage.length} chars)"}")
                Log.d("BlogAdapter", "Blog image: ${if (post.imageUrl.isNullOrEmpty()) "EMPTY" else "HAS DATA (${post.imageUrl.length} chars)"}")
                
                if (!post.authorProfileImage.isNullOrEmpty()) {
                    try {
                        val bitmap = ImageUtils.base64ToBitmap(post.authorProfileImage)
                        if (bitmap != null) {
                            ivAuthorProfile.setImageBitmap(bitmap)
                            ivAuthorProfile.clearColorFilter()
                            ivAuthorProfile.imageTintList = null
                            Log.d("BlogAdapter", "Profile image loaded successfully: ${bitmap.width}x${bitmap.height}")
                        } else {
                            Log.e("BlogAdapter", "Failed to convert base64 to bitmap")
                            ivAuthorProfile.setImageResource(R.drawable.ic_person)
                        }
                    } catch (e: Exception) {
                        Log.e("BlogAdapter", "Error loading profile image", e)
                        ivAuthorProfile.setImageResource(R.drawable.ic_person)
                    }
                } else {
                    Log.d("BlogAdapter", "No profile image, using default")
                    ivAuthorProfile.setImageResource(R.drawable.ic_person)
                }
                
                // Load blog post image
                if (!post.imageUrl.isNullOrEmpty()) {
                    try {
                        val bitmap = ImageUtils.base64ToBitmap(post.imageUrl)
                        if (bitmap != null) {
                            ivBlogImage.setImageBitmap(bitmap)
                            ivBlogImage.visibility = View.VISIBLE
                            Log.d("BlogAdapter", "Blog image loaded successfully: ${bitmap.width}x${bitmap.height}")
                        } else {
                            Log.e("BlogAdapter", "Failed to convert blog image base64 to bitmap")
                            ivBlogImage.visibility = View.GONE
                        }
                    } catch (e: Exception) {
                        Log.e("BlogAdapter", "Error loading blog image", e)
                        ivBlogImage.visibility = View.GONE
                    }
                } else {
                    ivBlogImage.visibility = View.GONE
                }
                
                // Format date
                val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
                tvDate.text = dateFormat.format(post.createdAt)
                
                // Update like count and button state
                tvLikeCount.text = post.likeCount.toString()
                
                val isLiked = currentUserId?.let { post.likedBy.contains(it) } ?: false
                btnLike.setImageResource(
                    if (isLiked) R.drawable.ic_favorite_filled 
                    else R.drawable.ic_favorite_border
                )
                
                // Update save button state
                val isSaved = currentUserId?.let { post.savedBy.contains(it) } ?: false
                btnSave.setImageResource(
                    if (isSaved) R.drawable.ic_bookmark_filled 
                    else R.drawable.ic_bookmark_border
                )

                // Show edit/delete buttons only for post owner
                val isOwner = currentUserId != null && currentUserId == post.authorId
                layoutAuthorActions.visibility = if (isOwner && (onEditClick != null || onDeleteClick != null)) {
                    View.VISIBLE
                } else {
                    View.GONE
                }
            }
        }
    }

    private class BlogPostDiffCallback : DiffUtil.ItemCallback<BlogPost>() {
        override fun areItemsTheSame(oldItem: BlogPost, newItem: BlogPost): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: BlogPost, newItem: BlogPost): Boolean {
            return oldItem == newItem
        }
    }
}
