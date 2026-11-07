package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.databinding.FragmentListDetailBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.loadBackdrop
import com.komputerkit.moview.util.showSnackbar

/** Screen 3: list detail — numbered for ranking, plain rows otherwise. */
class ListDetailFragment : Fragment() {

    private var _binding: FragmentListDetailBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private val args: ListDetailFragmentArgs by navArgs()
    private lateinit var adapter: ListFilmsAdapter
    private var touchHelper: ItemTouchHelper? = null
    private var currentList: FilmList? = null
    private var adapterKey: String? = null

    private val listId: Int get() = args.listId
    private val isOwner: Boolean get() = currentList?.userId == viewModel.currentUserId

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentListDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.btnEdit.setOnClickListener {
            findNavController().navigate(
                R.id.action_listDetail_to_listEditor,
                Bundle().apply { putInt("listId", listId) }
            )
        }
        binding.btnAddFilms.setOnClickListener {
            findNavController().navigate(
                R.id.action_listDetail_to_filmPicker,
                Bundle().apply { putInt("listId", listId) }
            )
        }
        binding.btnDelete.setOnClickListener { confirmDelete() }

        observe()
        viewModel.loadDetail(listId)
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadDetail(listId)
    }

    private fun observe() {
        viewModel.list.observe(viewLifecycleOwner) { list ->
            if (list == null) return@observe
            render(list)
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progress.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(viewLifecycleOwner) { message ->
            message?.let {
                showSnackbar(it, SnackbarType.ERROR)
                viewModel.clearError()
            }
        }
    }

    private fun render(list: FilmList) {
        currentList = list

        binding.tvTitle.text = list.title
        binding.tvDescription.text = list.description.orEmpty()
        binding.tvDescription.visibility = if (list.description.isNullOrBlank()) View.GONE else View.VISIBLE

        val typeLabel = if (list.isRanked) "Ranking" else "Biasa"
        val visibilityLabel = if (list.isPrivate) "Privat" else "Publik"
        binding.tvMeta.text = "${list.items.size} film • $typeLabel • $visibilityLabel"

        // Backdrop comes from film #1 and only when the owner enables it.
        val showBackdrop = list.useBackdrop && !list.backdropUrl.isNullOrBlank()
        binding.ivBackdrop.visibility = if (showBackdrop) View.VISIBLE else View.GONE
        binding.backdropScrim.visibility = if (showBackdrop) View.VISIBLE else View.GONE
        if (showBackdrop) binding.ivBackdrop.loadBackdrop(list.backdropUrl)

        binding.btnEdit.visibility = if (isOwner) View.VISIBLE else View.GONE
        binding.btnDelete.visibility = if (isOwner) View.VISIBLE else View.GONE
        binding.btnAddFilms.visibility = if (isOwner) View.VISIBLE else View.GONE

        binding.tvEmpty.visibility = if (list.items.isEmpty()) View.VISIBLE else View.GONE
        binding.tvHintReorder.visibility =
            if (isOwner && list.isRanked && list.items.size > 1) View.VISIBLE else View.GONE

        setupAdapter(list)
        adapter.submit(list.items)
    }

    private fun setupAdapter(list: FilmList) {
        val key = "${list.isRanked}-$isOwner"
        if (adapterKey == key && ::adapter.isInitialized) return
        adapterKey = key

        adapter = ListFilmsAdapter(
            ranked = list.isRanked,
            draggable = isOwner,
            onRemove = { item -> confirmRemove(item) },
            onArtwork = { item -> showArtworkSheet(item) },
            onDragStart = { holder -> touchHelper?.startDrag(holder) }
        )

        binding.rvItems.layoutManager = LinearLayoutManager(requireContext())
        binding.rvItems.adapter = adapter

        touchHelper?.attachToRecyclerView(null)
        touchHelper = null

        if (isOwner && list.isRanked) {
            val callback = object : ItemTouchHelper.SimpleCallback(
                ItemTouchHelper.UP or ItemTouchHelper.DOWN,
                0
            ) {
                override fun onMove(
                    recyclerView: RecyclerView,
                    viewHolder: RecyclerView.ViewHolder,
                    target: RecyclerView.ViewHolder
                ): Boolean {
                    adapter.moveItem(viewHolder.bindingAdapterPosition, target.bindingAdapterPosition)
                    return true
                }

                override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) = Unit

                override fun clearView(recyclerView: RecyclerView, viewHolder: RecyclerView.ViewHolder) {
                    super.clearView(recyclerView, viewHolder)
                    // Persist once the drag settles.
                    viewModel.reorder(listId, adapter.currentItems)
                }
            }
            touchHelper = ItemTouchHelper(callback).also { it.attachToRecyclerView(binding.rvItems) }
        }
    }

    private fun confirmRemove(item: FilmListItem) {
        android.app.AlertDialog.Builder(requireContext())
            .setTitle("Hapus film?")
            .setMessage("\"${item.title}\" akan dihapus dari list ini.")
            .setNegativeButton("Batal", null)
            .setPositiveButton("Hapus") { _, _ -> viewModel.removeFilm(listId, item.movieId) }
            .show()
    }

    private fun confirmDelete() {
        val list = currentList ?: return
        android.app.AlertDialog.Builder(requireContext())
            .setTitle("Hapus list?")
            .setMessage("\"${list.title}\" akan dihapus permanen.")
            .setNegativeButton("Batal", null)
            .setPositiveButton("Hapus") { _, _ ->
                viewModel.deleteList(listId)
                findNavController().navigateUp()
            }
            .show()
    }

    private fun showArtworkSheet(item: FilmListItem) {
        ArtworkSheetFragment.newInstance(listId, item.movieId, item.posterMediaId, item.backdropMediaId)
            .show(childFragmentManager, "artwork")
    }

    override fun onDestroyView() {
        super.onDestroyView()
        touchHelper?.attachToRecyclerView(null)
        touchHelper = null
        _binding = null
    }
}
