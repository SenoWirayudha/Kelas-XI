package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.tabs.TabLayout
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentMovieListsBinding
import com.komputerkit.moview.util.PagerSwipeGesture
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.postponeEnterUntilLaidOut
import com.komputerkit.moview.util.showSnackbar

/**
 * "Lists" screen from Movie Detail: public lists containing this film.
 * Tab All = everyone (+ own private), Tab Friends = people the viewer follows.
 * Mirrors the Watch screen's tab + swipe behaviour.
 */
class MovieListsFragment : Fragment() {

    private var _binding: FragmentMovieListsBinding? = null
    private val binding get() = _binding!!

    private val args: MovieListsFragmentArgs by navArgs()
    private val viewModel: FilmListViewModel by viewModels()

    private lateinit var adapter: MovieListsAdapter
    private var currentTab = 0

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMovieListsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }

        adapter = MovieListsAdapter { list ->
            findNavController().navigate(
                R.id.action_movieLists_to_listDetail,
                Bundle().apply { putInt("listId", list.id) }
            )
        }
        binding.rvLists.layoutManager = LinearLayoutManager(requireContext())
        binding.rvLists.adapter = adapter

        setupTabs()
        setupTabSwipe()
        setupObservers()

        // Defer the first load until the enter slide is done (same as the list screens).
        postponeEnterUntilLaidOut()
        viewModel.loadListsForMovie(args.movieId, friendsOnly = false)
    }

    private fun setupTabs() {
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("All"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Friends"))

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                currentTab = tab.position
                viewModel.loadListsForMovie(args.movieId, friendsOnly = tab.position == 1)
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) = Unit
            override fun onTabReselected(tab: TabLayout.Tab?) = Unit
        })
    }

    /** Same pager feel as the Watch screen: tap a tab or swipe the content. */
    private fun setupTabSwipe() {
        val gesture = PagerSwipeGesture(
            context = requireContext(),
            pageWidth = { binding.root.width.toFloat() },
            translate = { offset ->
                binding.rvLists.translationX = offset
                binding.tvEmpty.translationX = offset
            },
            canGoLeft = { currentTab < TAB_COUNT - 1 },
            canGoRight = { currentTab > 0 },
            onSwipe = { direction -> selectTab(currentTab + direction) },
            onDragEnd = {
                binding.rvLists.translationX = 0f
                binding.tvEmpty.translationX = 0f
            }
        )

        val listener = View.OnTouchListener { _, event -> gesture.onTouch(event) }
        binding.rvLists.setOnTouchListener(listener)
        binding.tvEmpty.setOnTouchListener(listener)
    }

    private fun selectTab(position: Int) {
        binding.tabLayout.getTabAt(position.coerceIn(0, TAB_COUNT - 1))?.select()
    }

    private fun setupObservers() {
        viewModel.movieLists.observe(viewLifecycleOwner) { lists ->
            adapter.submitList(lists)
            binding.tvEmpty.isVisible = lists.isEmpty() && viewModel.isLoading.value != true
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.isVisible = loading
            binding.rvLists.isVisible = !loading
            if (loading) binding.tvEmpty.isVisible = false
        }

        viewModel.error.observe(viewLifecycleOwner) { message ->
            message?.let {
                showSnackbar(it, SnackbarType.ERROR)
                viewModel.clearError()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        viewModel.clearMovieLists()
        _binding = null
    }

    private companion object {
        const val TAB_COUNT = 2
    }
}
