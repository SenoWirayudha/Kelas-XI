package com.komputerkit.moview.ui.ticket

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.databinding.FragmentTicketHistoryTabBinding

class TicketHistoryTabFragment : Fragment() {

    companion object {
        private const val ARG_TAB_TYPE = "arg_tab_type"
        const val TAB_ACTIVE = "active"
        const val TAB_HISTORY = "history"

        fun newInstance(tabType: String): TicketHistoryTabFragment {
            return TicketHistoryTabFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_TAB_TYPE, tabType)
                }
            }
        }
    }

    private var _binding: FragmentTicketHistoryTabBinding? = null
    private val binding get() = _binding!!

    private val viewModel: TicketHistoryViewModel by activityViewModels()
    private lateinit var adapter: TicketHistoryAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTicketHistoryTabBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        observeData()
    }

    private fun setupRecyclerView() {
        val tabType = arguments?.getString(ARG_TAB_TYPE) ?: TAB_ACTIVE
        val isHistoryTab = tabType == TAB_HISTORY

        adapter = TicketHistoryAdapter(
            onPrimaryActionClick = { item ->
                (activity as? TicketHistoryActivity)?.onTicketActionClicked(item)
            },
            onMovieClick = { item ->
                if (isHistoryTab) {
                    (activity as? TicketHistoryActivity)?.onTicketMovieClicked(item)
                }
            }
        )

        binding.rvTicketHistory.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTicketHistory.adapter = adapter
    }

    private fun observeData() {
        val tabType = arguments?.getString(ARG_TAB_TYPE) ?: TAB_ACTIVE

        if (tabType == TAB_ACTIVE) {
            viewModel.activeTickets.observe(viewLifecycleOwner) { tickets ->
                adapter.submitList(tickets)
                binding.tvEmpty.visibility = if (tickets.isEmpty()) View.VISIBLE else View.GONE
                binding.tvEmpty.text = "Belum ada tiket aktif"
            }
        } else {
            viewModel.historyTickets.observe(viewLifecycleOwner) { tickets ->
                adapter.submitList(tickets)
                binding.tvEmpty.visibility = if (tickets.isEmpty()) View.VISIBLE else View.GONE
                binding.tvEmpty.text = "Belum ada riwayat transaksi"
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
