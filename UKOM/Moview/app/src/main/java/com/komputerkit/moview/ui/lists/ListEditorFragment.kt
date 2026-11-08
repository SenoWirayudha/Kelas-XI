package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.databinding.FragmentListEditorBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.showSnackbar
import kotlinx.coroutines.launch

/** Screen 2: create or edit a list. UI state is local until Save. */
class ListEditorFragment : Fragment() {

    private var _binding: FragmentListEditorBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private val args: ListEditorFragmentArgs by navArgs()
    private var editing: FilmList? = null

    private lateinit var gridAdapter: PosterGridAdapter

    private lateinit var rankSpacing: RankRowSpacingDecoration
    private var rankSpacingApplied = false

    private val repository = MovieRepository()

    /** Films picked in this screen, in display order. */
    private val pickedItems = mutableListOf<FilmListItem>()
    private var navigatingAway = false

    private var rankOn = false
    private var publicOn = true
    private var backdropOn = false
    private var chosenBackdropUrl: String? = null
    private var chosenBackdropMediaId: Int? = null

    /** Film #1 when the screen loaded; a change drops the chosen backdrop. */
    private var originalFirstMovieId: Int? = null

    /** After changing a poster, only the grid is refreshed (form edits are kept). */
    private var refreshPostersOnly = false

    private val listId: Int get() = args.listId

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentListEditorBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvHeaderTitle.text = if (listId > 0) "Ubah List" else "Buat List"

        gridAdapter = PosterGridAdapter(
            // Same rank badge as Your List; hidden while Rank List is off.
            showRanks = { rankOn },
            onClick = { },
            onLongClick = { item, _ ->
                // Poster per list item: only an existing list can persist it.
                if (listId > 0) openPosterPicker(item.movieId)
            }
        )
        binding.rvPickedFilms.layoutManager = GridLayoutManager(requireContext(), GRID_SPAN)
        binding.rvPickedFilms.adapter = gridAdapter
        // Whole page scrolls as one: the grid never scrolls on its own.
        binding.rvPickedFilms.isNestedScrollingEnabled = false
        binding.rvPickedFilms.overScrollMode = View.OVER_SCROLL_NEVER
        rankSpacing = RankRowSpacingDecoration(
            GRID_SPAN,
            (RANK_ROW_SPACING_DP * resources.displayMetrics.density).toInt()
        )

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.btnSave.setOnClickListener { save() }
        binding.fabPick.setOnClickListener { openFilmPicker() }

        binding.toggleRank.setOnClickListener {
            rankOn = !rankOn
            renderToggles()
            // Badge visibility + row spacing depend on this toggle, not on item
            // content, so the grid needs an explicit refresh.
            applyRankSpacing(rankOn)
            gridAdapter.refreshRankBadges()
        }
        binding.togglePublic.setOnClickListener {
            publicOn = !publicOn
            renderToggles()
        }
        binding.toggleBackdrop.setOnClickListener {
            backdropOn = !backdropOn
            renderToggles()
        }
        binding.tvBackdropModify.setOnClickListener { openBackdropPicker() }

        // Result comes back from the "Pilih Film" screen.
        parentFragmentManager.setFragmentResultListener(
            FilmPickerFragment.RESULT_KEY,
            this
        ) { _, bundle ->
            val ids = bundle.getIntArray(FilmPickerFragment.RESULT_IDS)?.toList().orEmpty()
            val titles = bundle.getStringArray(FilmPickerFragment.RESULT_TITLES)?.toList().orEmpty()
            val posters = bundle.getStringArray(FilmPickerFragment.RESULT_POSTERS)?.toList().orEmpty()
            val years = bundle.getIntArray(FilmPickerFragment.RESULT_YEARS)?.toList().orEmpty()

            // Keep list-scoped custom artwork (and its preview) for films that
            // stay in the list; films added now keep the default artwork.
            val previousByMovie = pickedItems.associateBy { it.movieId }

            pickedItems.clear()
            ids.forEachIndexed { index, id ->
                val previous = previousByMovie[id]
                pickedItems.add(
                    FilmListItem(
                        movieId = id,
                        position = index + 1,
                        title = titles.getOrNull(index),
                        releaseYear = years.getOrNull(index)?.takeIf { it > 0 },
                        ageRating = null,
                        posterUrl = previous?.posterUrl ?: posters.getOrNull(index),
                        backdropUrl = previous?.backdropUrl,
                        customPoster = previous?.customPoster ?: false,
                        customBackdrop = previous?.customBackdrop ?: false,
                        posterMediaId = previous?.posterMediaId,
                        backdropMediaId = previous?.backdropMediaId
                    )
                )
            }
            if (_binding != null) renderFilms()
        }

        // Backdrop chosen on the reused Poster & Backdrop screen.
        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData("selected_backdrop_path", null as String?)
            ?.observe(viewLifecycleOwner) { path ->
                if (!path.isNullOrBlank()) {
                    chosenBackdropUrl = path
                    findNavController().currentBackStackEntry?.savedStateHandle
                        ?.remove<String>("selected_backdrop_path")
                    if (_binding != null) {
                        backdropOn = true
                        renderToggles()
                        showSnackbar("Backdrop list diperbarui.", SnackbarType.SUCCESS)
                    }
                }
            }

        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData("selected_backdrop_media_id", 0)
            ?.observe(viewLifecycleOwner) { mediaId ->
                if (mediaId != null && mediaId > 0) {
                    chosenBackdropMediaId = mediaId
                    findNavController().currentBackStackEntry?.savedStateHandle
                        ?.remove<Int>("selected_backdrop_media_id")
                    if (_binding != null) {
                        backdropOn = true
                        renderToggles()
                    }
                }
            }

        renderToggles()
        renderFilms()
        observe()

        // Poster/backdrop saved from the shared artwork screen: refresh quietly.
        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData("artwork_saved", false)
            ?.observe(viewLifecycleOwner) { saved ->
                if (!saved) return@observe
                findNavController().currentBackStackEntry?.savedStateHandle
                    ?.set("artwork_saved", false)
                if (listId > 0) {
                    refreshPostersOnly = true
                    viewModel.loadList(listId)
                }
            }

        if (listId > 0) {
            viewModel.loadList(listId)
        }

        // "Add to List" seeds the film so the new list already holds it.
        if (listId == 0 && args.presetMovieId > 0) {
            seedPresetMovie(args.presetMovieId)
        }
    }

    /** Loads the film from "Add to List" into the picker state. */
    private fun seedPresetMovie(movieId: Int) {
        if (pickedItems.any { it.movieId == movieId }) return

        viewLifecycleOwner.lifecycleScope.launch {
            val movie = repository.getMovieDetail(movieId) ?: return@launch
            if (_binding == null || pickedItems.any { it.movieId == movieId }) return@launch

            pickedItems.add(
                FilmListItem(
                    movieId = movieId,
                    position = pickedItems.size + 1,
                    title = movie.title,
                    releaseYear = movie.releaseYear,
                    ageRating = null,
                    posterUrl = movie.posterUrl,
                    backdropUrl = movie.backdropUrl
                )
            )
            renderFilms()
        }
    }

    private fun observe() {
        observeList()

        viewModel.isSaving.observe(viewLifecycleOwner) { saving ->
            binding.btnSave.isEnabled = !saving
            binding.btnSave.alpha = if (saving) 0.5f else 1f
        }

        viewModel.saved.observe(viewLifecycleOwner) { saved ->
            if (!saved || navigatingAway) return@observe
            viewModel.clearSaved()
            navigatingAway = true

            val createdId = viewModel.list.value?.id ?: 0

            if (listId > 0) {
                findNavController().navigateUp()
            } else if (args.returnToCaller) {
                // Came from "Add to List": the film is already part of the new
                // list, so just go back and let that screen refresh.
                val activity = activity
                findNavController().navigateUp()
                activity?.showSnackbar("List dibuat.", SnackbarType.SUCCESS)
            } else if (createdId > 0) {
                // Replace this screen with the new list's detail using the same
                // slide transition as every other list push.
                val options = androidx.navigation.NavOptions.Builder()
                    .setPopUpTo(R.id.listEditorFragment, true)
                    .setEnterAnim(R.anim.slide_in_right)
                    .setExitAnim(R.anim.slide_out_left)
                    .setPopEnterAnim(R.anim.slide_in_left)
                    .setPopExitAnim(R.anim.slide_out_right)
                    .build()
                findNavController().navigate(
                    R.id.action_listEditor_to_listDetail,
                    Bundle().apply { putInt("listId", createdId) },
                    options
                )
            } else {
                findNavController().navigateUp()
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { message ->
            message?.let {
                binding.tvError.text = it
                binding.tvError.visibility = View.VISIBLE
                viewModel.clearError()
            }
        }
    }

    private fun observeList() {
        viewModel.list.observe(viewLifecycleOwner) { list ->
            if (list == null || list.id != listId) return@observe

            if (refreshPostersOnly) {
                refreshPostersOnly = false
                // Keep the user's form/order, only adopt the new poster URLs.
                val postersByMovie = list.items.associate { it.movieId to it.posterUrl }
                pickedItems.forEachIndexed { index, item ->
                    postersByMovie[item.movieId]?.let { url ->
                        pickedItems[index] = item.copy(posterUrl = url)
                    }
                }
                chosenBackdropUrl = list.backdropUrl
                chosenBackdropMediaId = list.backdropMediaId
                renderFilms()
                return@observe
            }

            if (editing != null) return@observe
            editing = list
            prefill(list)
        }
    }

    private fun prefill(list: FilmList) {
        binding.etTitle.setText(list.title)
        binding.etDescription.setText(list.description.orEmpty())

        rankOn = list.isRanked
        publicOn = !list.isPrivate
        backdropOn = list.useBackdrop

        pickedItems.clear()
        pickedItems.addAll(list.items.sortedBy { it.position })
        chosenBackdropUrl = list.backdropUrl
        chosenBackdropMediaId = list.backdropMediaId
        originalFirstMovieId = pickedItems.firstOrNull()?.movieId

        renderToggles()
        renderFilms()
    }

    private fun renderToggles() {
        if (_binding == null) return
        // Active state stays blue but muted: the accent at low opacity, so it
        // sits calmly on the dark background instead of glowing.
        val accent = ContextCompat.getColor(requireContext(), R.color.toggle_active)
        val muted = ContextCompat.getColor(requireContext(), R.color.text_secondary)

        // Trophy: outline when off, solid when on (same silhouette).
        binding.ivRank.setImageResource(
            if (rankOn) R.drawable.trophy_fill_round else R.drawable.trophy_line_round
        )
        binding.ivRank.setColorFilter(if (rankOn) accent else muted)
        binding.tvRankLabel.setTextColor(if (rankOn) accent else muted)
        binding.badgeRank.visibility = if (rankOn) View.VISIBLE else View.GONE

        // Visibility: open eye = Public, crossed eye = Private.
        binding.ivPublic.setImageResource(
            if (publicOn) R.drawable.ic_eye else R.drawable.ic_visibility_off
        )
        binding.ivPublic.contentDescription = if (publicOn) "Public" else "Private"
        binding.ivPublic.setColorFilter(if (publicOn) accent else muted)
        binding.tvPublicLabel.text = if (publicOn) "Public" else "Private"
        binding.tvPublicLabel.setTextColor(if (publicOn) accent else muted)
        binding.badgePublic.visibility = if (publicOn) View.VISIBLE else View.GONE

        binding.ivBackdrop.setColorFilter(if (backdropOn) accent else muted)
        binding.tvBackdropLabel.setTextColor(if (backdropOn) accent else muted)
        binding.badgeBackdrop.visibility = if (backdropOn) View.VISIBLE else View.GONE
    }

    private fun renderFilms() {
        if (_binding == null) return
        applyRankSpacing(rankOn)
        gridAdapter.submit(pickedItems)
        binding.tvEmptyFilms.visibility = if (pickedItems.isEmpty()) View.VISIBLE else View.GONE
    }

    /** Ranked rows need extra top space so the badge never covers the row above. */
    private fun applyRankSpacing(ranked: Boolean) {
        if (ranked == rankSpacingApplied) return
        rankSpacingApplied = ranked

        if (ranked) {
            binding.rvPickedFilms.addItemDecoration(rankSpacing)
        } else {
            binding.rvPickedFilms.removeItemDecoration(rankSpacing)
        }
    }

    private fun openFilmPicker() {
        // Safe Args reads camelCase keys; snake_case here would silently be ignored.
        val bundle = Bundle().apply {
            putInt("listId", 0)
            putIntArray("movieIds", pickedItems.map { it.movieId }.toIntArray())
            putStringArray("movieTitles", pickedItems.map { it.title.orEmpty() }.toTypedArray())
            putStringArray("moviePosters", pickedItems.map { it.posterUrl.orEmpty() }.toTypedArray())
            putIntArray("movieYears", pickedItems.map { it.releaseYear ?: 0 }.toIntArray())
        }
        findNavController().navigate(R.id.action_listEditor_to_filmPicker, bundle)
    }

    /** Change Poster for one list item, reusing the app's artwork screen. */
    private fun openPosterPicker(movieId: Int) {
        val bundle = Bundle().apply {
            putInt("movieId", movieId)
            putBoolean("openBackdropsTab", false)
            putString("contextType", "films")
            putInt("favoriteId", 0)
            putInt("diariesId", 0)
            putBoolean("shareMode", false)
            putBoolean("listMode", true)
            putInt("listId", listId)
        }
        findNavController().navigate(R.id.action_listEditor_to_posterBackdrop, bundle)
    }

    private fun openBackdropPicker() {        val movieId = pickedItems.firstOrNull()?.movieId
        if (movieId == null) {
            showSnackbar("Tambahkan film dulu untuk memilih backdrop.", SnackbarType.INFO)
            return
        }

        val bundle = Bundle().apply {
            putInt("movieId", movieId)
            putBoolean("openBackdropsTab", true)
            putString("contextType", "films")
            putInt("favoriteId", 0)
            putInt("diariesId", 0)
            putBoolean("shareMode", false)
            // List context: backdrop options come from film #1 and are stored on
            // the list (listId 0 = not created yet, the editor keeps the choice).
            putBoolean("listMode", true)
            putInt("listId", listId)
        }
        findNavController().navigate(R.id.action_listEditor_to_posterBackdrop, bundle)
    }

    private fun save() {
        binding.tvError.visibility = View.GONE

        val title = binding.etTitle.text.toString().trim()
        if (title.isBlank()) {
            showSnackbar("Judul list wajib diisi.", SnackbarType.ERROR)
            return
        }

        // Film #1 changed → its backdrop no longer applies.
        val firstMovieId = pickedItems.firstOrNull()?.movieId
        val backdropMediaId = if (originalFirstMovieId != null && firstMovieId != originalFirstMovieId) {
            null
        } else {
            chosenBackdropMediaId
        }

        viewModel.saveList(
            listId = listId.takeIf { it > 0 },
            title = title,
            description = binding.etDescription.text.toString().trim().ifBlank { null },
            type = if (rankOn) FilmList.TYPE_RANKED else FilmList.TYPE_PLAIN,
            visibility = if (publicOn) FilmList.VISIBILITY_PUBLIC else FilmList.VISIBILITY_PRIVATE,
            useBackdrop = backdropOn,
            movieIds = pickedItems.map { it.movieId },
            backdropMediaId = backdropMediaId
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private companion object {
        /** Poster grid columns (matches the GridLayoutManager above). */
        const val GRID_SPAN = 4
        /** Gap between ranked rows; ~= half the 20dp rank badge. */
        const val RANK_ROW_SPACING_DP = 12
    }
}
