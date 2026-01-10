package com.komputerkit.moview.ui.notification

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.databinding.FragmentNotificationNewBinding

class NotificationFragment : Fragment() {

    private var _binding: FragmentNotificationNewBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: NotificationViewModel by viewModels()
    private lateinit var notificationAdapter: NotificationAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentNotificationNewBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
    }
    
    private fun setupRecyclerView() {
        notificationAdapter = NotificationAdapter()
        binding.rvNotifications.apply {
            adapter = notificationAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }
    
    private fun setupObservers() {
        viewModel.notifications.observe(viewLifecycleOwner) { notifications ->
            notificationAdapter.submitList(notifications)
        }
    }
    
    private fun setupClickListeners() {
        binding.btnMarkAllRead.setOnClickListener {
            viewModel.markAllAsRead()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
