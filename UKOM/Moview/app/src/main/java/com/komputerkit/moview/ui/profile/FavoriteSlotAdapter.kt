package com.komputerkit.moview.ui.profile

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.databinding.ItemFavoriteSlotBinding
import com.komputerkit.moview.util.loadThumbnail

/**
 * The 4 Top-Favorite slots. A plain (non-List) adapter so ItemTouchHelper can
 * reorder with notifyItemMoved; the backing list is mutated in place during a
 * drag and committed to the ViewModel on drop (then persisted on Save).
 */
class FavoriteSlotAdapter(
    private val onAddClick: (Int) -> Unit,
    private val onRemoveClick: (Int) -> Unit
) : RecyclerView.Adapter<FavoriteSlotAdapter.ViewHolder>() {

    private val items = mutableListOf<FavoriteSlot>()

    /** Exact slot height (px) derived from the measured cell width so the 2:3
     *  ratio survives RecyclerView's unspecified vertical measure pass. 0 = XML fallback. */
    var itemHeight: Int = 0

    /** Replace the whole list (add / remove / reload). */
    @SuppressLint("NotifyDataSetChanged")
    fun submitList(newList: List<FavoriteSlot>) {
        items.clear()
        items.addAll(newList)
        notifyDataSetChanged()
    }

    fun itemAt(position: Int): FavoriteSlot? = items.getOrNull(position)

    /** Snapshot of the current (post-drag) order for committing to the VM. */
    fun currentItems(): List<FavoriteSlot> = items.toList()

    /**
     * Shift-move: drag the movie at [from] onto [to]. Other movies shift down
     * (Top 1 -> pos 3 makes Top 2 the new Top 1), and empty "+" slots always
     * compact to the right so no gap opens in the middle.
     */
    fun onItemMove(from: Int, to: Int): Boolean {
        if (from == to) return true
        if (from !in items.indices || to !in items.indices) return false
        // Only filled slots are draggable; empty "+" slots never move.
        if (items[from].movie == null) return false
        // Can't drop onto an empty slot (keeps empties pinned right).
        if (items[to].movie == null) return false

        val item = items.removeAt(from)
        items.add(to, item)
        compactAndReindex()
        notifyItemMoved(from, to)
        return true
    }

    /** Re-bind just the rank badges of visible slots (live reorder feedback). */
    fun refreshRanks(recyclerView: RecyclerView) {
        for (i in 0 until recyclerView.childCount) {
            val holder = recyclerView.getChildViewHolder(recyclerView.getChildAt(i))
            val pos = holder.bindingAdapterPosition
            if (pos != RecyclerView.NO_POSITION && pos in items.indices) {
                (holder as? ViewHolder)?.bindRank(items[pos])
            }
        }
    }

    /** Keeps movies packed left and empty "+" slots on the right, renumbering 0..3. */
    private fun compactAndReindex() {
        val movies = items.filter { it.movie != null }
        val empties = items.filter { it.movie == null }
        items.clear()
        items.addAll((movies + empties).mapIndexed { i, slot -> slot.copy(index = i) })
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemFavoriteSlotBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        // Apply the width-derived height (2:3) so slots never collapse to 0.
        if (itemHeight > 0) {
            val lp = holder.itemView.layoutParams
            if (lp.height != itemHeight) {
                lp.height = itemHeight
                holder.itemView.layoutParams = lp
            }
        }
        holder.bind(getItem(position))
    }

    override fun getItemCount(): Int = items.size

    private fun getItem(position: Int): FavoriteSlot = items[position]

    inner class ViewHolder(
        private val binding: ItemFavoriteSlotBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(slot: FavoriteSlot) {
            val hasPoster = slot.movie != null

            // Show/hide appropriate card
            binding.cardPoster.isVisible = hasPoster
            binding.cardAdd.isVisible = !hasPoster

            if (hasPoster) {
                binding.ivPoster.loadThumbnail(slot.movie!!.posterUrl, slot.movie!!.title)
                bindRank(slot)

                binding.btnRemove.setOnClickListener {
                    onRemoveClick(slot.index)
                }
            } else {
                binding.cardAdd.setOnClickListener {
                    onAddClick(slot.index)
                }
            }
        }

        /** 1-based rank badge on filled slots. */
        fun bindRank(slot: FavoriteSlot) {
            if (slot.movie != null) {
                binding.tvRank.isVisible = true
                binding.tvRank.text = (slot.index + 1).toString()
            } else {
                binding.tvRank.isVisible = false
            }
        }
    }
}
