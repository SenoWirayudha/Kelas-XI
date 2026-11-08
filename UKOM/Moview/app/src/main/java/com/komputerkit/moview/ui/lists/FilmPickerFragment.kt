package com.komputerkit.moview.ui.lists

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.databinding.FragmentFilmPickerBinding
import com.komputerkit.moview.databinding.ItemPickRowBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.loadThumbnail
import com.komputerkit.moview.util.showSnackbar
import kotlinx.coroutines.launch

/**
 * Screen 3: films currently in the list — numbered, drag to reorder, + to add.
 * Adding reuses the profile "add favorite film" search screen.
 */
class FilmPickerFragment : Fragment() {

    private var _binding: FragmentFilmPickerBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private val args: FilmPickerFragmentArgs by navArgs()
    private val repository = MovieRepository()

    private lateinit var adapter: PickRowAdapter
    private var touchHelper: ItemTouchHelper? = null

    private val picks = mutableListOf<FilmListItem>()

    /** Seeded once: the fragment instance survives while the search screen is open. */
    private var seeded = false

    private val listId: Int get() = args.listId

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFilmPickerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        seedFromArgs()

        adapter = PickRowAdapter(
            onLongPress = { item -> confirmRemove(item) },
            onDragStart = { holder -> touchHelper?.startDrag(holder) }
        )

        binding.rvPicks.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPicks.adapter = adapter
        adapter.submit(picks)

        val callback = object : ItemTouchHelper.SimpleCallback(
            ItemTouchHelper.UP or ItemTouchHelper.DOWN,
            0
        ) {
            override fun onMove(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder,
                target: RecyclerView.ViewHolder
            ): Boolean {
                val moved = adapter.moveItem(
                    viewHolder.bindingAdapterPosition,
                    target.bindingAdapterPosition
                )
                // Live rank feedback without rebinding every row (that caused jank).
                if (moved) adapter.refreshRanks(recyclerView)
                return moved
            }

            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) = Unit

            override fun onSelectedChanged(viewHolder: RecyclerView.ViewHolder?, actionState: Int) {
                super.onSelectedChanged(viewHolder, actionState)
                if (actionState == ItemTouchHelper.ACTION_STATE_DRAG && viewHolder != null) {
                    viewHolder.itemView.performHapticFeedback(
                        android.view.HapticFeedbackConstants.LONG_PRESS
                    )
                    viewHolder.itemView.animate()
                        .scaleX(1.02f).scaleY(1.02f)
                        .setDuration(120).start()
                    viewHolder.itemView.elevation = 8f * resources.displayMetrics.density
                }
            }

            override fun clearView(recyclerView: RecyclerView, viewHolder: RecyclerView.ViewHolder) {
                super.clearView(recyclerView, viewHolder)
                viewHolder.itemView.animate().scaleX(1f).scaleY(1f).setDuration(120).start()
                viewHolder.itemView.elevation = 0f
                syncFromAdapter()
                persistOrder()
            }

            override fun isItemViewSwipeEnabled(): Boolean = false
        }
        touchHelper = ItemTouchHelper(callback).also { it.attachToRecyclerView(binding.rvPicks) }

        binding.btnBack.setOnClickListener {
            publishResult()
            findNavController().navigateUp()
        }

        // Reuses the search screen in "select movie" mode (profile favorites flow).
        binding.fabAdd.setOnClickListener {
            findNavController().navigate(
                R.id.action_filmPicker_to_search,
                Bundle().apply {
                    putBoolean("selectMovieMode", true)
                    putInt("slotIndex", -1)
                }
            )
        }

        // Search screen returns the picked film id through the back-stack handle.
        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData<Int>("selected_movie_id")
            ?.observe(viewLifecycleOwner) { movieId ->
                if (movieId == null || movieId <= 0) return@observe
                findNavController().currentBackStackEntry?.savedStateHandle
                    ?.remove<Int>("selected_movie_id")
                addMovie(movieId)
            }

        renderEmpty()

        // Existing list: start from what the server already has.
        if (listId > 0) {
            viewModel.list.observe(viewLifecycleOwner) { list ->
                if (list == null || list.id != listId || seeded) return@observe
                seeded = true
                picks.clear()
                picks.addAll(list.items.sortedBy { it.position })
                adapter.submit(picks)
                renderEmpty()
            }
            viewModel.loadDetail(listId)
        }
    }

    private fun seedFromArgs() {
        // Existing lists seed from the server instead (see onViewCreated).
        if (seeded || listId > 0) return
        seeded = true

        picks.clear()
        val ids = args.movieIds ?: intArrayOf()
        val titles = args.movieTitles ?: arrayOf()
        val posters = args.moviePosters ?: arrayOf()
        val years = args.movieYears ?: intArrayOf()

        ids.forEachIndexed { index, id ->
            picks.add(
                FilmListItem(
                    movieId = id,
                    position = index + 1,
                    title = titles.getOrNull(index),
                    releaseYear = years.getOrNull(index)?.takeIf { it > 0 },
                    ageRating = null,
                    posterUrl = posters.getOrNull(index),
                    backdropUrl = null
                )
            )
        }
    }

    private fun addMovie(movieId: Int) {
        if (picks.any { it.movieId == movieId }) {
            showSnackbar("Film sudah ada di list.", SnackbarType.INFO)
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            val movie = repository.getMovieDetail(movieId)
            picks.add(
                FilmListItem(
                    movieId = movieId,
                    position = picks.size + 1,
                    title = movie?.title,
                    releaseYear = movie?.releaseYear,
                    ageRating = null,
                    posterUrl = movie?.posterUrl,
                    backdropUrl = movie?.backdropUrl
                )
            )
            adapter.submit(picks)
            renderEmpty()
            publishResult()

            // Existing list: persist the addition right away.
            if (listId > 0) viewModel.addFilms(listId, listOf(movieId))
        }
    }

    private fun confirmRemove(item: FilmListItem) {
        android.app.AlertDialog.Builder(requireContext())
            .setTitle("Hapus film?")
            .setMessage("\"${item.title}\" akan dihapus dari list.")
            .setNegativeButton("Batal", null)
            .setPositiveButton("Hapus") { _, _ ->
                picks.removeAll { it.movieId == item.movieId }
                renumber()
                adapter.submit(picks)
                renderEmpty()
                publishResult()
                if (listId > 0) viewModel.removeFilm(listId, item.movieId)
            }
            .show()
    }

    private fun syncFromAdapter() {
        picks.clear()
        picks.addAll(adapter.currentItems)
    }

    private fun persistOrder() {
        if (listId > 0) viewModel.reorder(listId, picks)
        publishResult()
    }

    private fun renumber() {
        picks.forEachIndexed { index, item -> picks[index] = item.copy(position = index + 1) }
    }

    /** Hands the ordered picks back to the editor (creation flow only). */
    private fun publishResult() {
        if (listId > 0) return

        parentFragmentManager.setFragmentResult(
            RESULT_KEY,
            Bundle().apply {
                putIntArray(RESULT_IDS, picks.map { it.movieId }.toIntArray())
                putStringArray(RESULT_TITLES, picks.map { it.title.orEmpty() }.toTypedArray())
                putStringArray(RESULT_POSTERS, picks.map { it.posterUrl.orEmpty() }.toTypedArray())
                putIntArray(RESULT_YEARS, picks.map { it.releaseYear ?: 0 }.toIntArray())
            }
        )
    }

    private fun renderEmpty() {
        binding.tvEmpty.visibility = if (picks.isEmpty()) View.VISIBLE else View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        touchHelper?.attachToRecyclerView(null)
        touchHelper = null
        _binding = null
    }

    private class PickRowAdapter(
        private val onLongPress: (FilmListItem) -> Unit,
        private val onDragStart: (RecyclerView.ViewHolder) -> Unit
    ) : RecyclerView.Adapter<PickRowAdapter.Holder>() {

        private val items = mutableListOf<FilmListItem>()

        val currentItems: List<FilmListItem> get() = items.toList()

        @SuppressLint("NotifyDataSetChanged")
        fun submit(newItems: List<FilmListItem>) {
            items.clear()
            items.addAll(newItems)
            notifyDataSetChanged()
        }

        fun moveItem(from: Int, to: Int): Boolean {
            if (from == to) return true
            if (from !in items.indices || to !in items.indices) return false

            val moved = items.removeAt(from)
            items.add(to, moved)
            for (index in items.indices) {
                items[index] = items[index].copy(position = index + 1)
            }
            // Only move the row; rebinding all rows on every frame is what made it janky.
            notifyItemMoved(from, to)
            return true
        }

        /** Re-binds just the rank badges of visible rows (live reorder feedback). */
        fun refreshRanks(recyclerView: RecyclerView) {
            for (i in 0 until recyclerView.childCount) {
                val holder = recyclerView.getChildViewHolder(recyclerView.getChildAt(i))
                val pos = holder.bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION && pos in items.indices) {
                    (holder as? Holder)?.bindRank(items[pos])
                }
            }
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
            val binding = ItemPickRowBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return Holder(binding)
        }

        override fun getItemCount(): Int = items.size

        override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(items[position])

        inner class Holder(private val binding: ItemPickRowBinding) : RecyclerView.ViewHolder(binding.root) {
            fun bind(item: FilmListItem) {
                binding.ivPoster.loadThumbnail(item.posterUrl, item.title)
                binding.tvTitle.text = item.title.orEmpty()
                binding.tvYear.text = item.releaseYear?.toString().orEmpty()
                binding.tvYear.visibility = if (item.releaseYear == null) View.GONE else View.VISIBLE
                bindRank(item)

                binding.ivDrag.setOnTouchListener { _, _ ->
                    onDragStart(this@Holder)
                    false
                }
                binding.root.setOnLongClickListener {
                    onLongPress(item)
                    true
                }
            }

            /** Cheap re-bind used while dragging. */
            fun bindRank(item: FilmListItem) {
                binding.tvRank.text = item.position.toString()
            }
        }
    }

    companion object {
        const val RESULT_KEY = "film_picker_result"
        const val RESULT_IDS = "movie_ids"
        const val RESULT_TITLES = "movie_titles"
        const val RESULT_POSTERS = "movie_posters"
        const val RESULT_YEARS = "movie_years"
    }
}
