package com.komputerkit.whatsapp.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import com.komputerkit.whatsapp.StatusModel
import com.komputerkit.whatsapp.databinding.FragmentStatusBinding

/**
 * Fragment untuk menampilkan status orang
 */
class StatusFragment : Fragment() {
    
    private var _binding: FragmentStatusBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var auth: FirebaseAuth
    private lateinit var database: FirebaseDatabase
    private val statusList = ArrayList<StatusModel>()
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStatusBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
        database = FirebaseDatabase.getInstance()
        
        // Setup RecyclerView
        setupRecyclerView()
        
        // Load status
        loadStatus()
    }
    
    private fun setupRecyclerView() {
        binding.rvStatus.apply {
            layoutManager = LinearLayoutManager(context)
            // TODO: Add StatusAdapter
        }
    }
    
    private fun loadStatus() {
        // TODO: Load real status from Firebase
        // For now, show empty state
        binding.emptyState.visibility = View.VISIBLE
        binding.rvStatus.visibility = View.GONE
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
