package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.FragmentMyListsBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.showSnackbar

/** Screen 1: the user's own lists (public + private). */
class MyListsFragment : Fragment() {

    private var _binding: FragmentMyListsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private lateinit var adapter: MyListsAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMyListsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = MyListsAdapter(
            onClick = { list ->
                findNavController().navigate(
                    R.id.action_myLists_to_listDetail,
                    Bundle().apply { putInt("listId", list.id) }
                )
            },
            onLongClick = { list -> confirmDelete(list) }
        )

        binding.rvLists.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@MyListsFragment.adapter
        }

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.fabCreate.setOnClickListener {
            findNavController().navigate(R.id.action_myLists_to_listEditor)
        }

        observe()
        viewModel.loadMyLists()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadMyLists()
    }

    private fun observe() {
        viewModel.lists.observe(viewLifecycleOwner) { lists ->
            adapter.submitList(lists)
            binding.tvEmpty.visibility = if (lists.isEmpty()) View.VISIBLE else View.GONE
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

    private fun confirmDelete(list: FilmList) {
        android.app.AlertDialog.Builder(requireContext())
            .setTitle("Hapus list?")
            .setMessage("\"${list.title}\" akan dihapus permanen.")
            .setNegativeButton("Batal", null)
            .setPositiveButton("Hapus") { _, _ -> viewModel.deleteList(list.id) }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
