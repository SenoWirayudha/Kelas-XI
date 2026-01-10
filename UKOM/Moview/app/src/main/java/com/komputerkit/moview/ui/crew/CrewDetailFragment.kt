package com.komputerkit.moview.ui.crew

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import com.bumptech.glide.Glide
import com.google.android.material.tabs.TabLayout
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentCrewDetailBinding
import com.komputerkit.moview.util.TmdbImageUrl

// Data classes for crew detail
data class Role(val name: String, val films: List<Film>)
data class Film(val id: Int, val posterUrl: String, val year: String)

class CrewDetailFragment : Fragment() {

    private var _binding: FragmentCrewDetailBinding? = null
    private val binding get() = _binding!!
    
    private val args: CrewDetailFragmentArgs by navArgs()
    
    private lateinit var filmographyAdapter: FilmographyAdapter
    
    private var roles: List<Role> = emptyList()
    private var selectedRole: Role? = null

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
        // In real app, load from repository based on args.personId
        // For now, use sample data
        
        // Load profile
        binding.tvName.text = "Christopher Nolan"
        Glide.with(this)
            .load(TmdbImageUrl.getProfileUrl(TmdbImageUrl.Sample.PROFILE_NOLAN))
            .circleCrop()
            .into(binding.ivProfile)
        
        // Sample bio
        val bio = """
            Christopher Edward Nolan (born 30 July 1970) is a British-American filmmaker known for making personal, conceptually focused blockbuster movies. He is considered one of the leading filmmakers of the 21st century.
            
            Born in London and raised in both London and Chicago, Nolan developed an interest in filmmaking from a young age. After studying English literature at University College London, he made several short films before his feature film debut with Following (1998). Nolan gained international recognition with his second film, Memento (2000), for which he was nominated for the Academy Award for Best Original Screenplay.
            
            His subsequent films include the Batman Begins (2005) trilogy, The Prestige (2006), Inception (2010), Interstellar (2014), Dunkirk (2017), and Oppenheimer (2023). His work is frequently noted for its metaphysical themes, exploration of human morality, and the construction of time.
            
            Nolan has received numerous accolades, including Academy Awards, BAFTA Awards, and Golden Globes. He is known for his preference for shooting on film stock and his extensive use of practical effects over computer-generated imagery.
        """.trimIndent()
        
        // Sample filmography data
        roles = listOf(
            Role("Bio", emptyList()),
            Role("Director", listOf(
                Film(1, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR)!!, "2014"),
                Film(2, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNE)!!, "2020"),
                Film(3, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT)!!, "2008"),
                Film(4, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INCEPTION)!!, "2010"),
                Film(5, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNKIRK)!!, "2017"),
                Film(6, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_BATMAN_BEGINS)!!, "2005")
            )),
            Role("Writer", listOf(
                Film(1, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR)!!, "2014"),
                Film(2, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNE)!!, "2020"),
                Film(3, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT)!!, "2008"),
                Film(4, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INCEPTION)!!, "2010")
            )),
            Role("Producer", listOf(
                Film(1, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR)!!, "2014"),
                Film(5, TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNKIRK)!!, "2017")
            ))
        )
        
        // Setup tabs
        setupTabs(bio)
    }

    private fun setupTabs(bio: String) {
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
                    showRoleContent(role, bio)
                }
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
        
        // Select first tab (Bio) by default
        binding.tabLayout.selectTab(binding.tabLayout.getTabAt(0))
        showRoleContent(roles[0], bio)
    }

    private fun showRoleContent(role: Role, bio: String) {
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
