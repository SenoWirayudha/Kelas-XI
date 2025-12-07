package com.komputerkit.wavesoffood.ui.main

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import androidx.navigation.NavController
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.FragmentMainBinding

class MainFragment : Fragment() {
    private var _binding: FragmentMainBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMainBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        val navHostFragment = childFragmentManager
            .findFragmentById(R.id.nav_host_fragment_main) as NavHostFragment
        val navController = navHostFragment.navController
        
        binding.bottomNavigation.setupWithNavController(navController)
        
        // Handle bottom navigation visibility and state for non-bottom nav destinations
        navController.addOnDestinationChangedListener { _, destination, _ ->
            when (destination.id) {
                R.id.navigation_home,
                R.id.navigation_cart,
                R.id.navigation_orders,
                R.id.navigation_profile -> {
                    binding.bottomNavigation.visibility = View.VISIBLE
                }
                R.id.foodDetailFragment,
                R.id.orderDetailFragment,
                R.id.checkoutFragment -> {
                    // Hide bottom navigation for detail fragments
                    binding.bottomNavigation.visibility = View.GONE
                }
                else -> {
                    // For other unknown destinations, hide bottom navigation
                    binding.bottomNavigation.visibility = View.GONE
                }
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        
        // Ensure correct bottom navigation state when returning to this fragment
        val navHostFragment = childFragmentManager
            .findFragmentById(R.id.nav_host_fragment_main) as? NavHostFragment
        navHostFragment?.let { 
            val currentDestination = it.navController.currentDestination
            currentDestination?.let { destination ->
                when (destination.id) {
                    R.id.navigation_home,
                    R.id.navigation_cart,
                    R.id.navigation_orders,
                    R.id.navigation_profile -> {
                        binding.bottomNavigation.visibility = View.VISIBLE
                    }
                    else -> {
                        binding.bottomNavigation.visibility = View.GONE
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
