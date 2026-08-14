package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.MovieRelease
import com.komputerkit.moview.databinding.ItemMovieReleaseBinding
import com.komputerkit.moview.databinding.ItemReleaseSectionBinding
import com.komputerkit.moview.util.loadThumbnail
import java.text.SimpleDateFormat
import java.util.Locale

/** Single grouped section of the Rilis tab (a header + its release rows, already sorted). */
data class ReleaseSection(
    val title: String,
    val releases: List<MovieRelease>
)

/**
 * Renders the Rilis tab as grouped sections ordered Premiere -> Theatrical -> Streaming.
 * Each section header is followed by its release rows sorted chronologically.
 * Sections with no releases are omitted entirely (handled by caller).
 */
class MovieReleaseAdapter(
    private val sections: List<ReleaseSection>
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private companion object {
        const val TYPE_HEADER = 0
        const val TYPE_ROW = 1

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
        val (_, offset) = resolvePosition(position)
        return if (offset == 0) TYPE_HEADER else TYPE_ROW
    }

    override fun getItemCount(): Int = sections.sumOf { it.releases.size + 1 }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == TYPE_HEADER) {
            SectionViewHolder(
                ItemReleaseSectionBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            )
        } else {
            ReleaseViewHolder(
                ItemMovieReleaseBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            )
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val (section, offset) = resolvePosition(position)
        if (holder is SectionViewHolder) {
            holder.bind(section.title)
        } else if (holder is ReleaseViewHolder) {
            holder.bind(section.releases[offset - 1])
        }
    }

    /** Resolve a flat adapter position into (sectionIndex, offsetWithinSection). */
    private fun resolvePosition(position: Int): Pair<ReleaseSection, Int> {
        var remaining = position
        for (section in sections) {
            val size = section.releases.size + 1
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

    class ReleaseViewHolder(
        private val binding: ItemMovieReleaseBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(release: MovieRelease) {
            // Circular flag from bundled country flag drawable (flag_XX), null-safe
            val flagRes = release.countryCode?.lowercase(Locale.ENGLISH)
                ?.let { code ->
                    binding.root.context.resources.getIdentifier(
                        "flag_$code", "drawable", binding.root.context.packageName
                    )
                }
            if (flagRes != null && flagRes != 0) {
                binding.ivReleaseFlag.setImageResource(0)
                com.bumptech.glide.Glide.with(binding.root.context)
                    .load(flagRes)
                    .apply(
                        com.bumptech.glide.request.RequestOptions()
                            .placeholder(0)
                            .error(0)
                            .circleCrop()
                    )
                    .into(binding.ivReleaseFlag)
                binding.ivReleaseFlag.visibility = View.VISIBLE
            } else {
                binding.ivReleaseFlag.visibility = View.INVISIBLE
            }

            val country = release.countryName?.takeIf { it.isNotBlank() }
                ?: release.countryCode?.takeIf { it.isNotBlank() }
            binding.tvReleaseCountry.text = country ?: release.typeLabel

            if (!release.name.isNullOrBlank()) {
                binding.tvReleaseName.text = "— ${release.name}"
                binding.tvReleaseName.visibility = View.VISIBLE
            } else {
                binding.tvReleaseName.visibility = View.GONE
            }

            binding.tvReleaseDate.text = formatDateStatic(release.releaseDate)
        }
    }
}