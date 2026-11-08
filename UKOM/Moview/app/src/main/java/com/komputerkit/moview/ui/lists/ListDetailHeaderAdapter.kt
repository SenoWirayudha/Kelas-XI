package com.komputerkit.moview.ui.lists

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.ItemListDetailHeaderBinding
import com.komputerkit.moview.util.loadBackdrop
import com.komputerkit.moview.util.loadProfilePhoto

/**
 * Single-item adapter for the Your List header (backdrop + author + title +
 * stats). Kept separate so the poster grid can recycle independently inside
 * one RecyclerView (no nested scroll).
 */
class ListDetailHeaderAdapter(
    private val onOwnerClick: () -> Unit,
    private val onCommentsClick: () -> Unit
) : RecyclerView.Adapter<ListDetailHeaderAdapter.Holder>() {

    private var list: FilmList? = null
    private var isOwner: Boolean = false
    private var commentCount: Int = 0
    private var ownerFallbackAvatar: String? = null

    fun submit(list: FilmList, isOwner: Boolean, ownerFallbackAvatar: String?) {
        this.list = list
        this.isOwner = isOwner
        this.ownerFallbackAvatar = ownerFallbackAvatar
        if (itemCount > 0) notifyItemChanged(0)
    }

    fun setCommentCount(count: Int) {
        commentCount = count
        if (list != null) notifyItemChanged(0)
    }

    override fun getItemCount(): Int = if (list == null) 0 else 1

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemListDetailHeaderBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val current = list ?: return
        holder.bind(current, isOwner, commentCount, ownerFallbackAvatar)
    }

    inner class Holder(private val binding: ItemListDetailHeaderBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(list: FilmList, isOwner: Boolean, commentCount: Int, fallbackAvatar: String?) {
            binding.tvTitle.text = list.title
            binding.tvDescription.text = list.description.orEmpty()
            binding.tvDescription.visibility =
                if (list.description.isNullOrBlank()) View.GONE else View.VISIBLE

            val ownerName = list.ownerUsername ?: if (isOwner) "you" else "user"
            binding.tvUsername.text = "@$ownerName"
            binding.ivAvatar.loadProfilePhoto(
                list.ownerAvatarUrl ?: if (isOwner) fallbackAvatar else null
            )

            // Likes are not part of the list API yet; comment count comes from
            // the comments LiveData.
            binding.tvLikeCount.text = "0"
            binding.tvCommentCount.text = commentCount.toString()

            // Hero backdrop = backdrop of film #1, only when the owner enabled it.
            val showBackdrop = list.useBackdrop && !list.backdropUrl.isNullOrBlank()
            binding.backdropScrim.visibility = View.VISIBLE
            if (showBackdrop) {
                binding.ivBackdrop.loadBackdrop(list.backdropUrl)
            } else {
                binding.ivBackdrop.setImageDrawable(null)
                binding.ivBackdrop.setBackgroundColor(
                    androidx.core.content.ContextCompat.getColor(
                        binding.root.context,
                        R.color.dark_surface
                    )
                )
            }

            binding.tvEmpty.visibility = if (list.items.isEmpty()) View.VISIBLE else View.GONE

            // Same profile destination as tapping an author in a review.
            binding.ivAvatar.setOnClickListener { onOwnerClick() }
            binding.tvUsername.setOnClickListener { onOwnerClick() }
            binding.ivComment.setOnClickListener { onCommentsClick() }
            binding.tvCommentCount.setOnClickListener { onCommentsClick() }
        }
    }
}
