package com.komputerkit.moview.ui.detail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.api.CrewJobDto
import com.komputerkit.moview.data.api.CrewPersonDto
import com.komputerkit.moview.databinding.ItemCrewMemberBinding
import com.komputerkit.moview.databinding.ItemCrewMemberListBinding
import com.komputerkit.moview.util.loadAvatar

data class CrewMemberWithJob(
    val person: CrewPersonDto,
    val job: String
)

class CrewAdapter(
    private val onCrewClick: (CrewPersonDto) -> Unit = {}
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private var crewMembers = listOf<CrewMemberWithJob>()

    var isListView = false
        set(value) {
            if (field != value) {
                field = value
                notifyDataSetChanged()
            }
        }

    fun submitList(jobs: List<CrewJobDto>) {
        crewMembers = jobs.flatMap { job ->
            job.people.map { person -> CrewMemberWithJob(person, job.job) }
        }
        notifyDataSetChanged()
    }

    override fun getItemViewType(position: Int): Int = if (isListView) VIEW_LIST else VIEW_GRID

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == VIEW_LIST) {
            ListViewHolder(ItemCrewMemberListBinding.inflate(inflater, parent, false))
        } else {
            GridViewHolder(ItemCrewMemberBinding.inflate(inflater, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is ListViewHolder -> holder.bind(crewMembers[position], onCrewClick)
            is GridViewHolder -> holder.bind(crewMembers[position], onCrewClick)
        }
    }

    override fun getItemCount() = crewMembers.size

    class GridViewHolder(private val binding: ItemCrewMemberBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(member: CrewMemberWithJob, onClick: (CrewPersonDto) -> Unit) {
            binding.tvCrewName.text = member.person.name
            binding.tvJobTitle.text = member.job
            binding.ivCrewPhoto.loadAvatar(member.person.photo_url)
            binding.root.setOnClickListener { onClick(member.person) }
        }
    }

    class ListViewHolder(private val binding: ItemCrewMemberListBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(member: CrewMemberWithJob, onClick: (CrewPersonDto) -> Unit) {
            binding.tvCrewName.text = member.person.name
            binding.tvJobTitle.text = member.job
            binding.ivCrewPhoto.loadAvatar(member.person.photo_url)
            binding.root.setOnClickListener { onClick(member.person) }
        }
    }

    companion object {
        private const val VIEW_GRID = 0
        private const val VIEW_LIST = 1
    }
}
