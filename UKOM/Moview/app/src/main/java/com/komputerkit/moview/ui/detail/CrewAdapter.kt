package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.moview.data.api.CrewJobDto
import com.komputerkit.moview.data.api.CrewPersonDto
import com.komputerkit.moview.databinding.ItemCrewMemberBinding
import com.komputerkit.moview.util.loadAvatar

data class CrewMemberWithJob(
    val person: CrewPersonDto,
    val job: String
)

class CrewAdapter(
    private val onCrewClick: (CrewPersonDto) -> Unit = {}
) : RecyclerView.Adapter<CrewAdapter.CrewViewHolder>() {

    private var crewMembers = listOf<CrewMemberWithJob>()

    fun submitList(jobs: List<CrewJobDto>) {
        // Flatten the crew jobs into individual members with their job titles
        crewMembers = jobs.flatMap { job ->
            job.people.map { person ->
                CrewMemberWithJob(person, job.job)
            }
        }
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CrewViewHolder {
        val binding = ItemCrewMemberBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return CrewViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CrewViewHolder, position: Int) {
        holder.bind(crewMembers[position], onCrewClick)
    }

    override fun getItemCount() = crewMembers.size

    class CrewViewHolder(
        private val binding: ItemCrewMemberBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(crewMember: CrewMemberWithJob, onClick: (CrewPersonDto) -> Unit) {
            binding.tvCrewName.text = crewMember.person.name
            binding.tvJobTitle.text = crewMember.job
            
            binding.ivCrewPhoto.loadAvatar(crewMember.person.photo_url)
            
            binding.root.setOnClickListener {
                onClick(crewMember.person)
            }
        }
    }
}
