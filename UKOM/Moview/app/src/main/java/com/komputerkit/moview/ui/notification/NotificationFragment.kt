package com.komputerkit.moview.ui.notification

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.data.model.Notification
import com.komputerkit.moview.data.model.NotificationType
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
        
        // Load notifications on first view creation
        viewModel.loadNotifications()
    }
    
    override fun onResume() {
        super.onResume()
        // Refresh notifications when fragment resumes (e.g., after switching accounts)
        viewModel.refresh()
    }
    
    private fun setupRecyclerView() {
        notificationAdapter = NotificationAdapter { notification ->
            handleNotificationClick(notification)
        }
        binding.rvNotifications.apply {
            adapter = notificationAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }
    
    private fun setupObservers() {
        viewModel.notifications.observe(viewLifecycleOwner) { notifications ->
            notificationAdapter.submitList(notifications)
            binding.emptyState.visibility = if (notifications.isEmpty()) View.VISIBLE else View.GONE
            binding.rvNotifications.visibility = if (notifications.isEmpty()) View.GONE else View.VISIBLE
        }
        
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.swipeRefresh.isRefreshing = isLoading
        }
    }
    
    private fun setupClickListeners() {
        binding.btnMarkAllRead.setOnClickListener {
            viewModel.markAllAsRead()
        }
        
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.refresh()
        }
    }
    
    private fun handleNotificationClick(notification: Notification) {
        // Mark notification as read
        if (!notification.isRead) {
            viewModel.markAsRead(notification.id)
        }
        
        // Navigate based on notification type
        when (notification.type) {
            NotificationType.FOLLOW -> {
                // Navigate to profile
                val action = NotificationFragmentDirections.actionNotificationToProfile(notification.actorId)
                findNavController().navigate(action)
            }
            NotificationType.LIKE_REVIEW -> {
                // Navigate to review detail
                if (notification.reviewId != null) {
                    val action = NotificationFragmentDirections.actionNotificationToReviewDetail(
                        reviewId = notification.reviewId,
                        isLog = false,
                        openComments = false
                    )
                    findNavController().navigate(action)
                }
            }
            NotificationType.COMMENT_REVIEW, NotificationType.REPLY_COMMENT -> {
                // Navigate to review detail with comments section opened
                if (notification.reviewId != null) {
                    val action = NotificationFragmentDirections.actionNotificationToReviewDetail(
                        reviewId = notification.reviewId,
                        isLog = false,
                        openComments = true
                    )
                    findNavController().navigate(action)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
