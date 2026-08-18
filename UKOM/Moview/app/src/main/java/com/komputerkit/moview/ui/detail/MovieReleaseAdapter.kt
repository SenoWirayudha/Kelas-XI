package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.MovieRelease
import com.komputerkit.moview.databinding.ItemMovieReleaseBinding
import com.komputerkit.moview.databinding.ItemReleaseCountryBinding
import com.komputerkit.moview.databinding.ItemReleaseGroupBinding
import com.komputerkit.moview.databinding.ItemReleaseSectionBinding
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * One release date group inside a section: the date plus every country released on it.
 * A group with a single country renders as a normal row; a group with multiple
 * countries renders as one card with the date on the first country row and the
 * countries stacked underneath (not repeated per country).
 */
data class ReleaseGroup(
    val date: String?,
    val releases: List<MovieRelease>
)

/** Single grouped section of the Rilis tab (a header + its date groups, already sorted). */
data class ReleaseSection(
    val title: String,
    val groups: List<ReleaseGroup>
)

/**
 * Renders the Rilis tab as grouped sections ordered Premiere -> Theatrical -> Streaming.
 * Each section header is followed by its release date groups sorted chronologically.
 * Countries sharing the same release date are grouped into a single card: the date is
 * written once on the first row (right-aligned), the countries are stacked underneath.
 * Sections with no releases are omitted entirely (handled by caller).
 */
class MovieReleaseAdapter(
    private val sections: List<ReleaseSection>
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private companion object {
        const val TYPE_HEADER = 0
        const val TYPE_SINGLE = 1
        const val TYPE_GROUP = 2

        fun formatDateStatic(dateString: String?): String {
            if (dateString.isNullOrBlank()) return "—"
            return try {
                val inFmt = SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH)
                val outFmt = SimpleDateFormat("d MMM yyyy", Locale.ENGLISH)
                val date = inFmt.parse(dateString)
                if (date != null) outFmt.format(date) else dateString
            } catch (e: Exception) {
                dateString
            }
        }
    }

    override fun getItemViewType(position: Int): Int {
        val (section, offset) = resolvePosition(position)
        if (offset == 0) return TYPE_HEADER
        val group = section.groups[offset - 1]
        return if (group.releases.size > 1) TYPE_GROUP else TYPE_SINGLE
    }

    override fun getItemCount(): Int = sections.sumOf { it.groups.size + 1 }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return when (viewType) {
            TYPE_HEADER -> SectionViewHolder(
                ItemReleaseSectionBinding.inflate(inflater, parent, false)
            )
            TYPE_GROUP -> GroupViewHolder(
                ItemReleaseGroupBinding.inflate(inflater, parent, false)
            )
            else -> SingleViewHolder(
                ItemMovieReleaseBinding.inflate(inflater, parent, false)
            )
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val (section, offset) = resolvePosition(position)
        when (holder) {
            is SectionViewHolder -> holder.bind(section.title)
            is GroupViewHolder -> holder.bind(section.groups[offset - 1])
            is SingleViewHolder -> holder.bind(section.groups[offset - 1].releases.first())
        }
    }

    /** Resolve a flat adapter position into (section, offsetWithinSection). */
    private fun resolvePosition(position: Int): Pair<ReleaseSection, Int> {
        var remaining = position
        for (section in sections) {
            val size = section.groups.size + 1
            if (remaining < size) return section to remaining
            remaining -= size
        }
        throw IndexOutOfBoundsException("Position $position out of range")
    }

    class SectionViewHolder(
        private val binding: ItemReleaseSectionBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(title: String) {
            binding.root.text = title
        }
    }

    /** A single release date + one country (the common case). */
    class SingleViewHolder(
        private val binding: ItemMovieReleaseBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(release: MovieRelease) {
            bindCountry(binding.ivReleaseFlag, binding.tvReleaseCountry, binding.tvReleaseName, release)
            binding.tvReleaseDate.text = formatDateStatic(release.releaseDate)
            binding.tvReleaseDate.visibility = View.VISIBLE
        }
    }

    /** A single release date + multiple countries (grouped into one card). */
    class GroupViewHolder(
        private val binding: ItemReleaseGroupBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        private val inflater = LayoutInflater.from(binding.root.context)

        fun bind(group: ReleaseGroup) {
            binding.containerCountries.removeAllViews()
            val dateText = formatDateStatic(group.date)
            group.releases.forEachIndexed { index, release ->
                val row = ItemReleaseCountryBinding.inflate(inflater, binding.containerCountries, false)
                bindCountry(row.ivReleaseFlag, row.tvReleaseCountry, row.tvReleaseName, release)
                row.tvReleaseDate.text = dateText
                row.tvReleaseDate.visibility = if (index == 0) View.VISIBLE else View.INVISIBLE
                binding.containerCountries.addView(row.root)
            }
        }
    }
}

/** Populate flag + country + optional festival/platform name of a release. */
private fun bindCountry(
    flagView: ImageView,
    countryView: TextView,
    nameView: TextView,
    release: MovieRelease
) {
    val flagRes = release.countryCode?.lowercase(Locale.ENGLISH)
        ?.let { code ->
            flagView.context.resources.getIdentifier(
                "flag_$code", "drawable", flagView.context.packageName
            )
        }
    if (flagRes != null && flagRes != 0) {
        flagView.setImageResource(0)
        com.bumptech.glide.Glide.with(flagView.context)
            .load(flagRes)
            .apply(
                com.bumptech.glide.request.RequestOptions()
                    .placeholder(0)
                    .error(0)
                    .circleCrop()
            )
            .into(flagView)
        flagView.visibility = View.VISIBLE
    } else {
        // No bundled PNG flag -> show a round globe icon placeholder
        flagView.setImageResource(R.drawable.ic_globe_flag)
        flagView.visibility = View.VISIBLE
    }

    val country = release.countryName?.takeIf { it.isNotBlank() }
        ?: release.countryCode?.takeIf { it.isNotBlank() }
    countryView.text = country ?: release.typeLabel

    if (!release.name.isNullOrBlank()) {
        nameView.text = "— ${release.name}"
        nameView.visibility = View.VISIBLE
    } else {
        nameView.visibility = View.GONE
    }
}