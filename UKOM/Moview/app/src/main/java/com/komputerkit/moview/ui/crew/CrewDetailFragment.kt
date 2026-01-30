package com.komputerkit.moview.ui.crew

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.bumptech.glide.Glide
import com.google.android.material.tabs.TabLayout
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentCrewDetailBinding
import com.komputerkit.moview.data.repository.MovieRepository
import kotlinx.coroutines.launch

// Data classes for crew detail
data class Role(val name: String, val films: List<Film>)
data class Film(val id: Int, val posterUrl: String, val year: String)

class CrewDetailFragment : Fragment() {

    private var _binding: FragmentCrewDetailBinding? = null
    private val binding get() = _binding!!
    
    private val args: CrewDetailFragmentArgs by navArgs()
    private val repository = MovieRepository()
    
    private lateinit var filmographyAdapter: FilmographyAdapter
    
    private var roles: List<Role> = emptyList()
    private var selectedRole: Role? = null
    private var bio: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCrewDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupClickListeners()
        setupFilmographyGrid()
        loadCrewData()
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }

    private fun setupFilmographyGrid() {
        filmographyAdapter = FilmographyAdapter { film ->
            // Navigate to movie detail
            val action = CrewDetailFragmentDirections.actionCrewDetailToMovieDetail(film.id)
            findNavController().navigate(action)
        }
        
        binding.rvFilmography.apply {
            adapter = filmographyAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
        }
    }

    private fun loadCrewData() {
        // Show loading state
        binding.tvName.text = "Loading..."
        
        lifecycleScope.launch {
            val personDetail = repository.getPersonDetail(args.personId)
            
            if (personDetail != null) {
                // Update UI with real data
                binding.tvName.text = personDetail.name
                
                Glide.with(this@CrewDetailFragment)
                    .load(personDetail.photo_url)
                    .circleCrop()
                    .into(binding.ivProfile)
                
                bio = personDetail.bio ?: "No biography available."
                
                // Convert filmography to Role objects
                roles = mutableListOf<Role>().apply {
                    // Always add Bio as first tab
                    add(Role("Bio", emptyList()))
                    
                    // Add each job type as a tab
                    personDetail.filmography.forEach { (job, films) ->
                        add(Role(
                            name = job,
                            films = films.map { filmDto ->
                                Film(
                                    id = filmDto.id,
                                    posterUrl = filmDto.poster_path ?: "",
                                    year = filmDto.year.toString()
                                )
                            }
                        ))
                    }
                }
                
                setupTabs()
            } else {
                binding.tvName.text = "Failed to load person details"
            }
        }
    }

    private fun setupTabs() {
        // Clear existing tabs
        binding.tabLayout.removeAllTabs()
        
        // Add tabs for each role
        roles.forEach { role ->
            binding.tabLayout.addTab(
                binding.tabLayout.newTab().setText(role.name)
            )
        }
        
        // Tab selection listener
        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                tab?.let {
                    val role = roles[it.position]
                    showRoleContent(role)
                }
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
        
        // Select first tab (Bio) by default
        binding.tabLayout.selectTab(binding.tabLayout.getTabAt(0))
        showRoleContent(roles[0])
    }

    private fun showRoleContent(role: Role) {
        selectedRole = role
        
        if (role.name == "Bio") {
            // Show bio section
            binding.bioSection.visibility = View.VISIBLE
            binding.rvFilmography.visibility = View.GONE
            binding.tvBio.text = bio
        } else {
            // Show filmography grid
            binding.bioSection.visibility = View.GONE
            binding.rvFilmography.visibility = View.VISIBLE
            filmographyAdapter.submitList(role.films)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
