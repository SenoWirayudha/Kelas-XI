package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.FragmentListEditorBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.showSnackbar

/** Screen 2: create or edit a list. */
class ListEditorFragment : Fragment() {

    private var _binding: FragmentListEditorBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private val args: ListEditorFragmentArgs by navArgs()
    private var editing: FilmList? = null

    /** Films picked before the list exists; flushed right after creation. */
    private val pendingMovieIds = linkedSetOf<Int>()
    private var navigatingAway = false

    private val listId: Int
        get() = args.listId

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

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.btnSave.setOnClickListener { save() }
        binding.btnPickFilms.setOnClickListener {
            findNavController().navigate(R.id.action_listEditor_to_filmPicker)
        }

        // Fragment lifecycle (not view): the editor's view is destroyed while the
        // picker is open, but the result must still arrive.
        parentFragmentManager.setFragmentResultListener(
            FilmPickerFragment.RESULT_KEY,
            this
        ) { _, bundle ->
            if (_binding == null) return@setFragmentResultListener
            val ids = bundle.getIntArray(FilmPickerFragment.RESULT_IDS)?.toList().orEmpty()
            pendingMovieIds.clear()
            pendingMovieIds.addAll(ids)
            updateFilmsLabel()
        }

        observe()
        updateFilmsLabel()

        if (listId > 0) {
            viewModel.loadList(listId)
        }
    }

    private fun observe() {
        viewModel.list.observe(viewLifecycleOwner) { list ->
            if (list == null || list.id != listId || editing != null) return@observe
            editing = list
            prefill(list)
        }

        viewModel.isSaving.observe(viewLifecycleOwner) { saving ->
            binding.btnSave.isEnabled = !saving
            binding.btnSave.text = if (saving) "..." else "Simpan"
        }

        viewModel.saved.observe(viewLifecycleOwner) { saved ->
            if (!saved || navigatingAway) return@observe
            viewModel.clearSaved()
            navigatingAway = true

            val createdId = viewModel.list.value?.id ?: 0
            if (listId <= 0 && createdId > 0 && pendingMovieIds.isNotEmpty()) {
                viewModel.addFilms(createdId, pendingMovieIds.toList())
            }

            if (listId > 0) {
                findNavController().navigateUp()
            } else if (createdId > 0) {
                val options = androidx.navigation.NavOptions.Builder()
                    .setPopUpTo(R.id.listEditorFragment, true)
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

    private fun updateFilmsLabel() {
        val count = pendingMovieIds.size
        binding.tvFilmsSelected.visibility = if (count > 0) View.VISIBLE else View.GONE
        binding.tvFilmsSelected.text = "$count film dipilih"
        binding.btnPickFilms.text = if (count > 0) "+ Ubah Pilihan Film" else "+ Pilih Film"
    }

    private fun prefill(list: FilmList) {
        binding.etTitle.setText(list.title)
        binding.etDescription.setText(list.description.orEmpty())

        if (list.isRanked) binding.rbRanked.isChecked = true else binding.rbPlain.isChecked = true
        if (list.isPrivate) binding.rbPrivate.isChecked = true else binding.rbPublic.isChecked = true
        binding.swBackdrop.isChecked = list.useBackdrop
    }

    private fun save() {
        binding.tvError.visibility = View.GONE

        val title = binding.etTitle.text.toString().trim()
        if (title.isBlank()) {
            showSnackbar("Judul list wajib diisi.", SnackbarType.ERROR)
            return
        }

        val description = binding.etDescription.text.toString().trim()
        val type = if (binding.rbRanked.isChecked) FilmList.TYPE_RANKED else FilmList.TYPE_PLAIN
        val visibility = if (binding.rbPrivate.isChecked) {
            FilmList.VISIBILITY_PRIVATE
        } else {
            FilmList.VISIBILITY_PUBLIC
        }

        viewModel.saveList(
            listId = listId.takeIf { it > 0 },
            title = title,
            description = description.ifBlank { null },
            type = type,
            visibility = visibility,
            useBackdrop = binding.swBackdrop.isChecked
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
