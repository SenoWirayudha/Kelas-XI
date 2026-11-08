package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.data.model.FilmListItem
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.BottomSheetCommentsBinding
import com.komputerkit.moview.databinding.BottomSheetEntryActionsBinding
import com.komputerkit.moview.databinding.FragmentListDetailBinding
import com.komputerkit.moview.ui.adapter.CommentAdapter
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.loadBackdrop
import com.komputerkit.moview.util.loadProfilePhoto
import com.komputerkit.moview.util.showSnackbar

/** Screen 4: list detail — backdrop hero, author, stats, poster grid. */
class ListDetailFragment : Fragment() {

    private var _binding: FragmentListDetailBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private val args: ListDetailFragmentArgs by navArgs()

    private lateinit var gridAdapter: PosterGridAdapter
    private var currentList: FilmList? = null

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

        gridAdapter = PosterGridAdapter(
            showRanks = { currentList?.isRanked == true },
            onClick = { item -> openMovie(item) },
            onLongClick = { item, view -> showMovieSheet(item, view) }
        )
        binding.rvPosters.layoutManager = GridLayoutManager(requireContext(), 4)
        binding.rvPosters.adapter = gridAdapter

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.btnMore.setOnClickListener { showListMenu() }
        binding.ivComment.setOnClickListener { showCommentsSheet() }
        binding.tvCommentCount.setOnClickListener { showCommentsSheet() }

        observe()
        viewModel.loadDetail(listId)
        viewModel.loadComments(listId)

        // Poster/backdrop changed from the shared artwork screen.
        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData("artwork_saved", false)
            ?.observe(viewLifecycleOwner) { saved ->
                if (!saved) return@observe
                findNavController().currentBackStackEntry?.savedStateHandle
                    ?.set("artwork_saved", false)
                viewModel.loadDetail(listId)
            }
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadDetail(listId)
        viewModel.loadComments(listId)
    }

    private fun observe() {
        viewModel.list.observe(viewLifecycleOwner) { list ->
            if (list == null || list.id != listId) return@observe
            render(list)
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progress.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.commentCount.observe(viewLifecycleOwner) { count ->
            binding.tvCommentCount.text = count.toString()
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

        // Author block: owner comes from the list response; local prefs only as
        // a fallback while the field is missing.
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
        val fallbackUsername = prefs.getString("username", null)
        val ownerName = list.ownerUsername
            ?: if (isOwner) (fallbackUsername ?: "you") else "user"
        binding.tvUsername.text = "@$ownerName"
        binding.ivAvatar.loadProfilePhoto(
            list.ownerAvatarUrl
                ?: if (isOwner) prefs.getString("profilePhotoUrl", null) else null
        )

        // Likes are not part of the list API yet; comment count is owned by
        // the comments LiveData so it is not reset here.
        binding.tvLikeCount.text = "0"

        // Hero backdrop = backdrop of film #1, only when the owner enabled it.
        val showBackdrop = list.useBackdrop && !list.backdropUrl.isNullOrBlank()
        binding.ivBackdrop.visibility = View.VISIBLE
        binding.backdropScrim.visibility = View.VISIBLE
        if (showBackdrop) {
            binding.ivBackdrop.loadBackdrop(list.backdropUrl)
        } else {
            binding.ivBackdrop.setImageDrawable(null)
            binding.ivBackdrop.setBackgroundColor(
                androidx.core.content.ContextCompat.getColor(requireContext(), R.color.dark_surface)
            )
        }

        val items = list.items.sortedBy { it.position }
        gridAdapter.submit(items)
        binding.tvEmpty.visibility = if (items.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun openMovie(item: FilmListItem) {
        findNavController().navigate(
            R.id.action_listDetail_to_movieDetail,
            Bundle().apply { putInt("movieId", item.movieId) }
        )
    }

    /** Same poster long-press sheet used across the app. */
    private fun showMovieSheet(item: FilmListItem, view: View) {
        MovieActionsHelper.showMovieActionsBottomSheet(
            context = requireContext(),
            movie = Movie(
                id = item.movieId,
                title = item.title,
                posterUrl = item.posterUrl,
                averageRating = 0f,
                genre = "",
                releaseYear = item.releaseYear,
                description = ""
            ),
            lifecycleOwner = viewLifecycleOwner,
            isFromMovieDetail = false,
            onGoToFilm = { movie -> openMovie(item.copy(movieId = movie.id)) },
            onLogFilm = null,
            onChangePoster = {
                // Poster is stored on this list item only (reuses the artwork screen).
                if (isOwner) openPosterPicker(item.movieId)
            }
        )
    }

    private fun openPosterPicker(movieId: Int) {
        findNavController().navigate(
            R.id.action_listDetail_to_posterBackdrop,
            Bundle().apply {
                putInt("movieId", movieId)
                putBoolean("openBackdropsTab", false)
                putString("contextType", "films")
                putInt("favoriteId", 0)
                putInt("diariesId", 0)
                putBoolean("shareMode", false)
                putBoolean("listMode", true)
                putInt("listId", listId)
            }
        )
    }

    /** Reuses the review screen's entry-actions sheet for the list itself. */
    private fun showListMenu() {
        val list = currentList ?: return
        if (!isOwner) {
            showSnackbar("List ini bukan milik Anda.", SnackbarType.INFO)
            return
        }

        val dialog = BottomSheetDialog(requireContext(), R.style.BottomSheetDialogTheme)
        val sheet = BottomSheetEntryActionsBinding.inflate(layoutInflater)
        dialog.setContentView(sheet.root)
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
        dialog.window?.setDimAmount(0.4f)
        dialog.behavior.state = BottomSheetBehavior.STATE_EXPANDED
        dialog.behavior.skipCollapsed = true

        sheet.tvMovieTitle.text = list.title
        sheet.tvMovieYear.text = "${list.items.size} Films"
        sheet.tvDeleteLabel.text = "Delete list"
        sheet.btnShareInstagram.visibility = View.GONE

        sheet.btnEdit.setOnClickListener {
            dialog.dismiss()
            findNavController().navigate(
                R.id.action_listDetail_to_listEditor,
                Bundle().apply { putInt("listId", list.id) }
            )
        }

        sheet.btnDeleteEntry.setOnClickListener {
            dialog.dismiss()
            confirmDelete(list)
        }

        dialog.show()
    }

    private fun confirmDelete(list: FilmList) {
        android.app.AlertDialog.Builder(requireContext())
            .setTitle("Hapus list?")
            .setMessage("\"${list.title}\" akan dihapus permanen.")
            .setNegativeButton("Batal", null)
            .setPositiveButton("Hapus") { _, _ ->
                viewModel.deleteList(list.id)
                findNavController().navigateUp()
            }
            .show()
    }

    /** Reuses the review screen's comments sheet, including its fixed height
     *  so the "+" FAB is visible without scrolling. */
    private fun showCommentsSheet() {
        viewModel.loadComments(listId)

        val dialog = BottomSheetDialog(requireContext(), R.style.BottomSheetDialogTheme)
        val sheet = BottomSheetCommentsBinding.inflate(layoutInflater)
        dialog.setContentView(sheet.root)
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
        dialog.window?.setDimAmount(0.4f)

        // Same 75%-of-screen height the review screen uses.
        dialog.setOnShowListener {
            val bottomSheet = (it as BottomSheetDialog).findViewById<android.widget.FrameLayout>(
                com.google.android.material.R.id.design_bottom_sheet
            )
            bottomSheet?.let { sheetView ->
                val behavior = BottomSheetBehavior.from(sheetView)
                val maxHeight = (resources.displayMetrics.heightPixels * 0.75).toInt()
                sheetView.layoutParams = sheetView.layoutParams.apply { height = maxHeight }
                behavior.peekHeight = maxHeight
                behavior.state = BottomSheetBehavior.STATE_EXPANDED
                behavior.isHideable = true
                behavior.skipCollapsed = true
                behavior.isDraggable = true
            }
        }

        sheet.layoutReference.visibility = View.GONE
        sheet.btnClose.setOnClickListener { dialog.dismiss() }

        val adapter = CommentAdapter(
            currentUserId = viewModel.currentUserId,
            onProfileClick = { },
            onReplyClick = { },
            onDeleteClick = { },
            onFlagClick = { }
        )
        // Without a layout manager the RecyclerView measures zero rows, so the
        // list count updates but no comment is ever drawn.
        sheet.rvComments.layoutManager = LinearLayoutManager(requireContext())
        sheet.rvComments.adapter = adapter

        viewModel.comments.observe(viewLifecycleOwner) { comments ->
            adapter.submitList(comments)
            sheet.tvTitle.text = "Comments (${comments.size})"
            binding.tvCommentCount.text = comments.size.toString()
        }

        sheet.fabAddComment.setOnClickListener {
            showAddCommentSheet()
        }

        dialog.show()
    }

    /** Reuses the app's existing add-comment input sheet and posts to the list. */
    private fun showAddCommentSheet() {
        val sheetDialog = BottomSheetDialog(requireContext(), R.style.BottomSheetDialogTheme)
        val sheet = com.komputerkit.moview.databinding.DialogAddCommentBinding.inflate(layoutInflater)
        sheetDialog.setContentView(sheet.root)

        sheetDialog.setOnShowListener { dialog ->
            val bottomSheet = (dialog as BottomSheetDialog).findViewById<android.widget.FrameLayout>(
                com.google.android.material.R.id.design_bottom_sheet
            )
            bottomSheet?.let {
                val behavior = BottomSheetBehavior.from(it)
                behavior.state = BottomSheetBehavior.STATE_EXPANDED
                behavior.skipCollapsed = true
            }
        }

        sheet.layoutReference.visibility = View.GONE
        sheet.btnCancel.setOnClickListener { sheetDialog.dismiss() }

        sheet.btnPost.setOnClickListener {
            val text = sheet.etComment.text?.toString()?.trim().orEmpty()
            if (text.isEmpty()) {
                showSnackbar("Komentar tidak boleh kosong.", SnackbarType.ERROR)
                return@setOnClickListener
            }

            viewModel.addComment(listId, text)
            sheetDialog.dismiss()
        }

        sheetDialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
