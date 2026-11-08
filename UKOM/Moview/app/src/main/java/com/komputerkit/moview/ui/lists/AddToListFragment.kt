package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.tabs.TabLayout
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.FilmList
import com.komputerkit.moview.databinding.FragmentAddToListBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.showSnackbar

/**
 * "Add to List": multi-select one of the user's lists (Public/Private tabs)
 * to append the film to, or create a new list with the film pre-seeded.
 */
class AddToListFragment : Fragment() {

    private var _binding: FragmentAddToListBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private val args: AddToListFragmentArgs by navArgs()

    private lateinit var adapter: AddToListAdapter

    /** false = Public tab, true = Private tab. */
    private var privateTab = false

    private var allLists: List<FilmList> = emptyList()

    /** Guards against a double tap firing two add runs. */
    private var submitting = false

    private val movieId: Int get() = args.movieId

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAddToListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = AddToListAdapter()
        binding.rvLists.layoutManager = LinearLayoutManager(requireContext())
        binding.rvLists.adapter = adapter

        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Public"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Private"))
        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                privateTab = tab.position == 1
                render()
            }

            override fun onTabUnselected(tab: TabLayout.Tab) = Unit
            override fun onTabReselected(tab: TabLayout.Tab) = Unit
        })

        binding.btnConfirm.setOnClickListener { confirm() }
        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.fabCreate.setOnClickListener {
            findNavController().navigate(
                R.id.action_addToList_to_listEditor,
                Bundle().apply {
                    putInt("listId", 0)
                    putInt("presetMovieId", movieId)
                    putBoolean("returnToCaller", true)
                }
            )
        }

        observe()
    }

    override fun onResume() {
        super.onResume()
        // Also refreshes after a list is created from the FAB.
        viewModel.loadMyListsForMovie(movieId)
    }

    private fun observe() {
        viewModel.lists.observe(viewLifecycleOwner) { lists ->
            allLists = lists
            render()
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progress.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.addResult.observe(viewLifecycleOwner) { added ->
            if (added == null) return@observe
            viewModel.clearAddResult()
            closeWithResult(added)
        }

        viewModel.error.observe(viewLifecycleOwner) { message ->
            message?.let {
                submitting = false
                showSnackbar(it, SnackbarType.ERROR)
                viewModel.clearError()
            }
        }
    }

    private fun render() {
        if (_binding == null) return
        val filtered = allLists.filter { it.isPrivate == privateTab }
        adapter.submitList(filtered)
        binding.tvEmpty.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun confirm() {
        if (submitting) return
        val selected = adapter.selectedListIds()
        if (selected.isEmpty()) return
        submitting = true
        viewModel.addMovieToLists(movieId, selected)
    }

    private fun closeWithResult(added: Int) {
        val activity = activity ?: return
        findNavController().navigateUp()
        if (added > 0) {
            activity.showSnackbar("Ditambahkan ke $added list", SnackbarType.SUCCESS)
        } else {
            activity.showSnackbar("Film sudah ada di list yang dipilih.", SnackbarType.INFO)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
