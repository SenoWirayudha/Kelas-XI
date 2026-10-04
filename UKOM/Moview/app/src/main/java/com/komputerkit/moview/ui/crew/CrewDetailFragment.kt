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
import com.komputerkit.moview.util.resolveMediaUrl
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

// Data classes for crew detail
data class Role(val name: String, val films: List<Film>)
data class Film(val id: Int, val posterUrl: String, val year: String, val title: String = "")

class CrewDetailFragment : Fragment() {

    private var _binding: FragmentCrewDetailBinding? = null
    private val binding get() = _binding!!
    
    private val args: CrewDetailFragmentArgs by navArgs()
    private val repository = MovieRepository()
    
    private lateinit var filmographyAdapter: FilmographyAdapter
    
    private var roles: List<Role> = emptyList()
    private var selectedRole: Role? = null
    private var bio: String = ""
    private var dateOfBirth: String? = null
    private var nationality: String? = null

    private var loadedPersonId: Int? = null
    private var loadingJob: Job? = null

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
        filmographyAdapter = FilmographyAdapter(
            onFilmClick = { film ->
                val action = CrewDetailFragmentDirections.actionCrewDetailToMovieDetail(film.id)
                findNavController().navigate(action)
            },
            onLogFilm = { film ->
                val action = CrewDetailFragmentDirections.actionCrewDetailToLogFilm(film.id)
                findNavController().navigate(action)
            },
            onChangePoster = { film ->
                val action = CrewDetailFragmentDirections.actionCrewDetailToPosterBackdrop(film.id, false)
                findNavController().navigate(action)
            }
        )
        
        binding.rvFilmography.apply {
            adapter = filmographyAdapter
            layoutManager = GridLayoutManager(requireContext(), 4)
        }
    }

    private fun loadCrewData() {
        // Sudah pernah dimuat: render ulang dari cache tanpa refetch / "Loading..."
        if (loadedPersonId == args.personId && roles.isNotEmpty()) {
            setupTabs()
            return
        }
        if (loadingJob?.isActive == true) return

        // Show loading state
        binding.tvName.text = "Loading..."

        loadingJob = viewLifecycleOwner.lifecycleScope.launch {
            val personDetail = repository.getPersonDetail(args.personId)
            
            if (personDetail != null) {
                // Update UI with real data
                binding.tvName.text = personDetail.name
                
                Glide.with(this@CrewDetailFragment)
                    .load(personDetail.photo_url)
                    .placeholder(R.drawable.ic_default_profile)
                    .error(R.drawable.ic_default_profile)
                    .circleCrop()
                    .into(binding.ivProfile)
                
                bio = personDetail.bio ?: "No biography available."
                dateOfBirth = personDetail.date_of_birth
                nationality = personDetail.nationality

                // Fetch user-specific type=films custom posters in one batch
                val allFilmIds = personDetail.filmography.values.flatten().map { it.id }.distinct()
                val userId = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE).getInt("userId", 0)
                val customMedia = if (userId > 0 && allFilmIds.isNotEmpty()) {
                    repository.batchCustomMedia(userId, allFilmIds, "films")
                } else emptyMap()

                // Convert filmography to Role objects
                roles = mutableListOf<Role>().apply {
                    // Always add Bio as first tab
                    add(Role("Bio", emptyList()))

                    // Add each job type as a tab
                    personDetail.filmography.forEach { (job, films) ->
                        add(Role(
                            name = job,
                            films = films.map { filmDto ->
                                val entry = customMedia[filmDto.id]
                                val customPoster = entry?.poster?.takeIf { !it.is_default }?.path?.let { resolveMediaUrl(it) }
                                Film(
                                    id = filmDto.id,
                                    posterUrl = customPoster ?: filmDto.poster_path ?: "",
                                    year = filmDto.year.toString(),
                                    title = filmDto.title
                                )
                            }
                        ))
                    }
                }

                loadedPersonId = args.personId
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
        
        // Select first tab (Bio) by default, atau pulihkan tab yang terpilih sebelumnya
        val restoreIndex = roles.indexOfFirst { it.name == selectedRole?.name }.takeIf { it >= 0 } ?: 0
        binding.tabLayout.selectTab(binding.tabLayout.getTabAt(restoreIndex))
        showRoleContent(roles[restoreIndex])
    }

    private fun showRoleContent(role: Role) {
        selectedRole = role
        
        if (role.name == "Bio") {
            // Show bio section
            binding.bioSection.visibility = View.VISIBLE
            binding.rvFilmography.visibility = View.GONE
            renderPersonInfo()
            binding.tvBio.text = bio
        } else {
            // Show filmography grid
            binding.bioSection.visibility = View.GONE
            binding.rvFilmography.visibility = View.VISIBLE
            filmographyAdapter.submitList(role.films)
        }
    }

    /**
     * Born & Nationality di atas teks bio. Baris kosong disembunyikan;
     * jika keduanya kosong, blok tidak tampil (tanpa celah).
     */
    private fun renderPersonInfo() {
        val bornValue = dateOfBirth?.let { formatDob(it) }
        if (bornValue != null) {
            binding.tvBornValue.text = bornValue
            binding.rowBorn.visibility = View.VISIBLE
        } else {
            binding.rowBorn.visibility = View.GONE
        }

        val nationalValue = nationality?.trim()?.takeIf { it.isNotEmpty() }
        if (nationalValue != null) {
            binding.tvNationalityValue.text = nationalValue
            binding.rowNationality.visibility = View.VISIBLE
        } else {
            binding.rowNationality.visibility = View.GONE
        }

        binding.personInfoSection.visibility =
            if (bornValue != null || nationalValue != null) View.VISIBLE else View.GONE
    }

    /**
     * Format tanggal DOB apa adanya, tanpa menggeser tanggal:
     * - "yyyy-MM-dd" (10 karakter): parse & format langsung — tanpa konversi zona waktu.
     * - ISO bertanda zona (bentuk aktual API persons, mis. "1970-11-10T17:00:00.000000Z"
     *   = UTC dari tanggal tersimpan): diformat di zona penyimpanan backend
     *   (Asia/Jakarta, tetap — BUKAN zona/locale perangkat) agar tanggal yang
     *   disimpan admin tampil persis seperti yang disimpan.
     * Locale mengikuti sumber hardcode Indonesia yang dipakai header bulan Diary.
     * Tanggal tidak valid → null (baris disembunyikan, tanpa crash).
     */
    private fun formatDob(raw: String): String? {
        val s = raw.trim()
        if (s.isEmpty()) return null
        return try {
            val output = SimpleDateFormat("d MMM yyyy", Locale.forLanguageTag("id-ID"))
            when {
                Regex("\\d{4}-\\d{2}-\\d{2}").matches(s) -> {
                    val parser = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { isLenient = false }
                    output.format(parser.parse(s) ?: return null)
                }
                Regex("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?([Zz]|[+-]\\d{2}:?\\d{2})").matches(s) -> {
                    val normalized = s.replace(Regex("\\.\\d+"), "")
                    val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX", Locale.US).apply { isLenient = false }
                    val instant = parser.parse(normalized) ?: return null
                    output.timeZone = TimeZone.getTimeZone("Asia/Jakarta")
                    output.format(instant)
                }
                Regex("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?").matches(s) -> {
                    val normalized = s.replace(Regex("\\.\\d+"), "")
                    val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply { isLenient = false }
                    output.format(parser.parse(normalized) ?: return null)
                }
                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
