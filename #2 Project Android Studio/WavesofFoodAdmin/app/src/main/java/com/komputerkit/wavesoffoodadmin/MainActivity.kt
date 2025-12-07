package com.komputerkit.wavesoffoodadmin

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.komputerkit.wavesoffoodadmin.activity.LoginActivity
import com.komputerkit.wavesoffoodadmin.activity.MenuManagementActivity
import com.komputerkit.wavesoffoodadmin.activity.OrderManagementActivity
import com.komputerkit.wavesoffoodadmin.activity.UserManagementActivity
import com.komputerkit.wavesoffoodadmin.databinding.ActivityMainBinding
import com.komputerkit.wavesoffoodadmin.repository.OrderRepository
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private val orderRepository = OrderRepository()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()
        setupWindowInsets()
        setupClickListeners()
        loadDashboardData()
        
        // Test Firestore connection
        testFirestoreConnection()
        
        // Check if admin is logged in
        checkAdminAuth()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
    }
    
    private fun setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.main) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
    }
    
    private fun setupClickListeners() {
        binding.cardMenuManagement.setOnClickListener {
            startActivity(Intent(this, MenuManagementActivity::class.java))
        }
        
        binding.cardOrderManagement.setOnClickListener {
            startActivity(Intent(this, OrderManagementActivity::class.java))
        }
        
        binding.cardUserManagement.setOnClickListener {
            startActivity(Intent(this, UserManagementActivity::class.java))
        }
    }
    
    private fun loadDashboardData() {
        lifecycleScope.launch {
            try {
                val stats = orderRepository.getOrderStats()
                
                binding.tvTotalOrders.text = stats["total"]?.toString() ?: "0"
                binding.tvPendingOrders.text = stats["pending"]?.toString() ?: "0"
                
                // Update welcome message with admin name
                val currentUser = FirebaseHelper.getCurrentUser()
                binding.tvWelcome.text = "Selamat Datang, ${currentUser?.email ?: "Admin"}"
                
            } catch (e: Exception) {
                Utils.showToast(this@MainActivity, "Gagal memuat data dashboard")
            }
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_refresh -> {
                loadDashboardData()
                Utils.showToast(this, "Data diperbarui")
                true
            }
            R.id.action_logout -> {
                logout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun logout() {
        FirebaseHelper.getAuth().signOut()
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
    
    override fun onResume() {
        super.onResume()
        loadDashboardData()
    }
    
    private fun testFirestoreConnection() {
        // Test dengan mengambil beberapa data dari collection foods
        FirebaseHelper.getFoodsCollection()
            .limit(1)
            .get()
            .addOnSuccessListener { documents ->
                if (!documents.isEmpty) {
                    Utils.showToast(this, "Firestore connected! Found ${documents.size()} food items")
                } else {
                    Utils.showToast(this, "Firestore connected but no food data found")
                }
            }
            .addOnFailureListener { exception ->
                Utils.showLongToast(this, "Firestore connection failed: ${exception.message}")
            }
    }
    
    private fun checkAdminAuth() {
        if (!FirebaseHelper.isUserLoggedIn()) {
            // Redirect to login activity
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        FirebaseHelper.isCurrentUserAdmin { isAdmin ->
            if (!isAdmin) {
                Utils.showLongToast(this, "Access denied: Admin privileges required")
                // Sign out non-admin user
                FirebaseHelper.getAuth().signOut()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
        }
    }
}