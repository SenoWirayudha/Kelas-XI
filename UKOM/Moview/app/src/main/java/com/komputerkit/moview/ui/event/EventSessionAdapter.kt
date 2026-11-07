package com.komputerkit.moview.ui.event

import android.animation.ValueAnimator
import android.graphics.Color
import android.text.TextUtils
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import androidx.core.content.ContextCompat
import androidx.core.graphics.ColorUtils
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.EventSession
import com.komputerkit.moview.databinding.ItemEventSessionBinding
import com.komputerkit.moview.util.PosterFallbackDrawable
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale

/** Session cards on the event detail screen. */
class EventSessionAdapter(
    private val onSelect: (EventSession) -> Unit
) : ListAdapter<EventSession, EventSessionAdapter.SessionViewHolder>(Diff()) {

    private var selectedId: Int = -1
    private val expandedIds = mutableSetOf<Int>()

    fun setSelected(id: Int) {
        selectedId = id
        notifyItemRangeChanged(0, itemCount)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SessionViewHolder {
        val binding = ItemEventSessionBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return SessionViewHolder(
            binding = binding,
            onSelect = onSelect,
            selectedId = { selectedId },
            isExpanded = { expandedIds.contains(it) },
            toggleExpanded = { id ->
                if (expandedIds.contains(id)) expandedIds.remove(id) else expandedIds.add(id)
                val index = currentList.indexOfFirst { it.id == id }
                if (index >= 0) notifyItemChanged(index)
            }
        )
    }

    override fun onBindViewHolder(holder: SessionViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class SessionViewHolder(
        private val binding: ItemEventSessionBinding,
        private val onSelect: (EventSession) -> Unit,
        private val selectedId: () -> Int,
        private val isExpanded: (Int) -> Boolean,
        private val toggleExpanded: (Int) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        private var boundSessionId = -1
        private var selectProgress = 0f
        private var selectAnimator: ValueAnimator? = null

        fun bind(session: EventSession) {
            val context = binding.root.context

            val title = if (session.isSurprise) {
                session.sessionTitle ?: "Film Kejutan"
            } else {
                session.sessionTitle
                    ?: session.films.firstOrNull()?.title
                    ?: "Sesi Festival"
            }
            binding.tvTitle.text = title

            val isMulti = session.films.size > 1
            val synopsis = session.films.firstOrNull()?.synopsis

            val metaParts = buildList {
                EventSessionAdapter.formatSessionTime(session.startsAt).takeIf { it.isNotBlank() }?.let { add(it) }
                if (session.totalDurationMinutes > 0) {
                    add("${session.totalDurationMinutes} Menit")
                }
                session.ageRating?.takeIf { it.isNotBlank() }?.let { add(it) }
            }
            binding.tvMeta.text = metaParts.joinToString(" • ")
            binding.tvMeta.visibility = if (metaParts.isEmpty()) View.GONE else View.VISIBLE

            // 21+ sessions require an ID check at the door.
            val is21Plus = session.ageRating?.trim() == "21+"
            binding.layoutAgeWarning.visibility = if (is21Plus) View.VISIBLE else View.GONE

            if (session.isSurprise) {
                // Surprise: only the session title, time, duration and age are shown.
                binding.tvFilms.visibility = View.GONE
                binding.tvSynopsis.visibility = View.GONE
                binding.tvShow.visibility = View.GONE
                binding.tvShow.setOnClickListener(null)
            } else if (isMulti) {
                binding.tvFilms.visibility = View.VISIBLE
                binding.tvFilms.text = session.films.joinToString(" | ") { it.title }
                binding.tvSynopsis.visibility = View.GONE
                binding.tvShow.visibility = View.GONE
                binding.tvShow.setOnClickListener(null)
            } else {
                binding.tvFilms.visibility = View.GONE
                val hasSynopsis = !synopsis.isNullOrBlank()
                binding.tvSynopsis.visibility = if (hasSynopsis) View.VISIBLE else View.GONE
                binding.tvSynopsis.text = synopsis
                binding.tvShow.visibility = if (hasSynopsis) View.VISIBLE else View.GONE

                // "Show" expands/collapses the full synopsis.
                val expanded = isExpanded(session.id)
                binding.tvSynopsis.maxLines = if (expanded) Int.MAX_VALUE else 2
                binding.tvSynopsis.ellipsize = if (expanded) null else TextUtils.TruncateAt.END
                binding.tvShow.text = if (expanded) "Hide" else "Show"
                binding.tvShow.setOnClickListener {
                    if (hasSynopsis) toggleExpanded(session.id)
                }
            }

            val posterUrl = session.posterUrl
                ?: if (session.isSurprise) null else session.films.firstOrNull()?.posterUrl
            Glide.with(context)
                .load(posterUrl)
                .placeholder(PosterFallbackDrawable(context, title))
                .error(PosterFallbackDrawable(context, title))
                .centerCrop()
                .into(binding.ivPoster)

            val selected = selectedId() == session.id

            // Availability comes from the server (WIB clock): tersedia / sold_out /
            // belum_dibuka / selesai. Anything other than "tersedia" disables buying.
            val available = session.status == STATUS_AVAILABLE

            if (!available) {
                binding.layoutPriceRow.visibility = View.GONE
                binding.btnState.visibility = View.VISIBLE
                binding.btnState.text = when (session.status) {
                    STATUS_SOLD_OUT -> "Sold out"
                    STATUS_NOT_OPEN -> "Belum Dibuka"
                    else -> "Selesai"
                }
                binding.btnState.isEnabled = false
            } else {
                binding.layoutPriceRow.visibility = View.VISIBLE
                binding.btnState.visibility = View.GONE
                binding.tvPrice.text = formatRange(session.minPrice, session.maxPrice)
            }

            binding.btnSelect.text = "Select Ticket"
            binding.btnSelect.isEnabled = available
            animateSelection(selected, session.id)

            val click = View.OnClickListener {
                if (available) onSelect(session)
            }
            binding.btnSelect.setOnClickListener(click)
            binding.cardSession.setOnClickListener(click)
        }

        /**
         * Selected = filled accent, unselected = soft outline. Same 180ms decelerate
         * motion spec used elsewhere in the app.
         */
        private fun animateSelection(selected: Boolean, sessionId: Int) {
            val target = if (selected) 1f else 0f
            selectAnimator?.cancel()

            // Recycled onto a different card: snap instead of animating the old state.
            if (boundSessionId != sessionId) {
                boundSessionId = sessionId
                selectProgress = target
                applySelection(selectProgress)
                return
            }

            if (selectProgress == target) {
                applySelection(selectProgress)
                return
            }

            selectAnimator = ValueAnimator.ofFloat(selectProgress, target).apply {
                duration = SELECT_DURATION
                interpolator = DecelerateInterpolator()
                addUpdateListener { animator ->
                    selectProgress = animator.animatedValue as Float
                    applySelection(selectProgress)
                }
                start()
            }
        }

        private fun applySelection(progress: Float) {
            val context = binding.root.context
            val accent = ContextCompat.getColor(context, R.color.accent_blue)
            // The card's own background, so the fill looks opaque while it blends in.
            val cardBase = Color.parseColor("#1A1F29")
            val density = context.resources.displayMetrics.density

            binding.btnSelect.backgroundTintList =
                android.content.res.ColorStateList.valueOf(
                    ColorUtils.blendARGB(cardBase, accent, progress)
                )
            binding.btnSelect.strokeWidth = ((1f - progress) * density).toInt()
            binding.btnSelect.setTextColor(
                ColorUtils.blendARGB(
                    ContextCompat.getColor(context, R.color.text_primary),
                    ContextCompat.getColor(context, R.color.white),
                    progress
                )
            )
            binding.cardSession.strokeColor = ColorUtils.blendARGB(
                ContextCompat.getColor(context, R.color.input_border),
                accent,
                progress
            )
        }
    }

    private class Diff : DiffUtil.ItemCallback<EventSession>() {
        override fun areItemsTheSame(oldItem: EventSession, newItem: EventSession) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: EventSession, newItem: EventSession) = oldItem == newItem
    }

    companion object {
        const val STATUS_AVAILABLE = "tersedia"
        const val STATUS_SOLD_OUT = "sold_out"
        const val STATUS_NOT_OPEN = "belum_dibuka"

        /** 180ms matches the app's decelerate selection transitions. */
        private const val SELECT_DURATION = 180L

        fun formatRange(min: Double?, max: Double?): String {
            if (min == null) return "-"
            val formatter = NumberFormat.getNumberInstance(Locale("id", "ID"))
            val low = "Rp ${formatter.format(min)}"
            if (max == null || max <= min) return low
            return "$low – Rp ${formatter.format(max)}"
        }

        /** "HH:mm" from a "yyyy-MM-dd HH:mm:ss" session timestamp. */
        fun formatSessionTime(startsAt: String): String = try {
            val date = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).parse(startsAt)
            SimpleDateFormat("HH:mm", Locale.US).format(date!!)
        } catch (_: Exception) {
            if (startsAt.length >= 16) startsAt.substring(11, 16) else startsAt
        }
    }
}