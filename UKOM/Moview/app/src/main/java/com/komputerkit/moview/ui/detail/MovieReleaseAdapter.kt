package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.MovieRelease
import com.komputerkit.moview.databinding.ItemMovieReleaseBinding
import java.text.SimpleDateFormat
import java.util.Locale

class MovieReleaseAdapter(
    private val items: List<MovieRelease>
) : RecyclerView.Adapter<MovieReleaseAdapter.MovieReleaseViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MovieReleaseViewHolder {
        val binding = ItemMovieReleaseBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return MovieReleaseViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MovieReleaseViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class MovieReleaseViewHolder(
        private val binding: ItemMovieReleaseBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(release: MovieRelease) {
            binding.tvReleaseType.text = release.typeLabel
            binding.tvReleaseType.setBackgroundResource(
                when (release.type) {
                    "premiere" -> R.drawable.bg_badge_release_premiere
                    "streaming" -> R.drawable.bg_badge_release_streaming
                    else -> R.drawable.bg_badge_release_theatrical
                }
            )

            binding.tvReleaseFlag.text = release.flagEmoji
            binding.tvReleaseFlag.visibility = if (release.flagEmoji.isNullOrBlank()) View.GONE else View.VISIBLE

            binding.tvReleaseCountry.text = when {
                !release.countryName.isNullOrBlank() -> release.countryName
                !release.name.isNullOrBlank() -> release.name
                else -> release.typeLabel
            }

            if (!release.name.isNullOrBlank() && release.name != release.countryName) {
                binding.tvReleaseName.text = "— ${release.name}"
                binding.tvReleaseName.visibility = View.VISIBLE
            } else {
                binding.tvReleaseName.visibility = View.GONE
            }

            binding.tvReleaseDate.text = formatDate(release.releaseDate)
        }
    }

    private fun formatDate(dateString: String?): String {
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