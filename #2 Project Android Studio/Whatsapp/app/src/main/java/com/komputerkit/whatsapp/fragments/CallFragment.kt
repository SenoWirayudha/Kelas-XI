package com.komputerkit.whatsapp.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import com.komputerkit.whatsapp.CallModel
import com.komputerkit.whatsapp.databinding.FragmentCallBinding

/**
 * Fragment untuk menampilkan history panggilan
 */
class CallFragment : Fragment() {
    
    private var _binding: FragmentCallBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var auth: FirebaseAuth
    private lateinit var database: FirebaseDatabase
    private val callList = ArrayList<CallModel>()
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCallBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
        database = FirebaseDatabase.getInstance()
        
        // Setup RecyclerView
        setupRecyclerView()
        
        // Load calls
        loadCalls()
    }
    
    private fun setupRecyclerView() {
        binding.rvCalls.apply {
            layoutManager = LinearLayoutManager(context)
            // TODO: Add CallAdapter
        }
    }
    
    private fun loadCalls() {
        // TODO: Load real call history from Firebase
        // For now, show empty state
        binding.emptyState.visibility = View.VISIBLE
        binding.rvCalls.visibility = View.GONE
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
