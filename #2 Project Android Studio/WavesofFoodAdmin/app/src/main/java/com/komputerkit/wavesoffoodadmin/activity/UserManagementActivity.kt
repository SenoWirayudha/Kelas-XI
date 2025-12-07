package com.komputerkit.wavesoffoodadmin.activity

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.wavesoffoodadmin.Utils
import com.komputerkit.wavesoffoodadmin.adapter.UserAdapter
import com.komputerkit.wavesoffoodadmin.databinding.ActivityUserManagementBinding
import com.komputerkit.wavesoffoodadmin.model.User
import com.komputerkit.wavesoffoodadmin.model.UserWithOrderCount
import com.komputerkit.wavesoffoodadmin.repository.UserRepository
import com.komputerkit.wavesoffoodadmin.repository.OrderRepository
import kotlinx.coroutines.launch

class UserManagementActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityUserManagementBinding
    private lateinit var userAdapter: UserAdapter
    private val userRepository = UserRepository()
    private val orderRepository = OrderRepository()
    private val users = mutableListOf<User>()
    private val usersWithOrderCount = mutableListOf<UserWithOrderCount>()
    private val filteredUsersWithOrderCount = mutableListOf<UserWithOrderCount>()
    
    // Filter state
    private var currentFilter: UserFilter = UserFilter.ALL
    private var currentSearchQuery: String = ""
    
    enum class UserFilter {
        ALL, ACTIVE, BANNED
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUserManagementBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()
        setupRecyclerView()
        setupSearch()
        setupFilterButtons()
        loadUsers()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }
    
    private fun setupRecyclerView() {
        userAdapter = UserAdapter(filteredUsersWithOrderCount) { user, action ->
            when (action) {
                "view_details" -> viewUserDetails(user)
                "view_orders" -> viewUserOrders(user)
                "ban" -> showBanDialog(user)
                "unban" -> confirmUnbanUser(user)
            }
        }
        
        binding.rvUsers.apply {
            adapter = userAdapter
            layoutManager = LinearLayoutManager(this@UserManagementActivity)
        }
    }
    
    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                currentSearchQuery = s.toString()
                applyFilters()
            }
            
            override fun afterTextChanged(s: Editable?) {}
        })
    }
    
    private fun setupFilterButtons() {
        binding.btnFilterAll.setOnClickListener {
            setActiveFilter(UserFilter.ALL)
        }
        
        binding.btnFilterActive.setOnClickListener {
            setActiveFilter(UserFilter.ACTIVE)
        }
        
        binding.btnFilterBanned.setOnClickListener {
            setActiveFilter(UserFilter.BANNED)
        }
        
        // Set initial active filter
        setActiveFilter(UserFilter.ALL)
    }
    
    private fun setActiveFilter(filter: UserFilter) {
        currentFilter = filter
        
        // Update button styles
        resetFilterButtonStyles()
        when (filter) {
            UserFilter.ALL -> {
                binding.btnFilterAll.setBackgroundColor(getColor(android.R.color.holo_blue_light))
            }
            UserFilter.ACTIVE -> {
                binding.btnFilterActive.setBackgroundColor(getColor(android.R.color.holo_green_light))
            }
            UserFilter.BANNED -> {
                binding.btnFilterBanned.setBackgroundColor(getColor(android.R.color.holo_red_light))
            }
        }
        
        applyFilters()
    }
    
    private fun resetFilterButtonStyles() {
        val defaultColor = getColor(android.R.color.transparent)
        binding.btnFilterAll.setBackgroundColor(defaultColor)
        binding.btnFilterActive.setBackgroundColor(defaultColor)
        binding.btnFilterBanned.setBackgroundColor(defaultColor)
    }
    
    private fun loadUsers() {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                android.util.Log.d("UserManagementActivity", "Loading users and order counts...")
                val userList = userRepository.getAllUsers()
                android.util.Log.d("UserManagementActivity", "Found ${userList.size} users")
                
                users.clear()
                users.addAll(userList)
                
                // Calculate order count for each user
                usersWithOrderCount.clear()
                for (user in userList) {
                    val orderCount = orderRepository.getOrderCountByUserId(user.id)
                    android.util.Log.d("UserManagementActivity", "User ${user.name} (${user.id}) has $orderCount orders")
                    usersWithOrderCount.add(UserWithOrderCount(user, orderCount))
                }
                
                // Update filtered list
                applyFilters()
                
                showEmpty(usersWithOrderCount.isEmpty())
                
            } catch (e: Exception) {
                android.util.Log.e("UserManagementActivity", "Error loading users: ${e.message}")
                Utils.showLongToast(this@UserManagementActivity, "Gagal memuat data pengguna: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }
    
    private fun applyFilters() {
        filteredUsersWithOrderCount.clear()
        
        var filtered = usersWithOrderCount.toList()
        
        // Apply status filter
        filtered = when (currentFilter) {
            UserFilter.ALL -> filtered
            UserFilter.ACTIVE -> filtered.filter { !it.user.isBanned }
            UserFilter.BANNED -> filtered.filter { it.user.isBanned }
        }
        
        // Apply search filter
        if (currentSearchQuery.isNotEmpty()) {
            filtered = filtered.filter { userWithOrderCount ->
                val user = userWithOrderCount.user
                user.name.contains(currentSearchQuery, ignoreCase = true) ||
                user.email.contains(currentSearchQuery, ignoreCase = true) ||
                user.getPhoneNumber().contains(currentSearchQuery, ignoreCase = true)
            }
        }
        
        filteredUsersWithOrderCount.clear()
        filteredUsersWithOrderCount.addAll(filtered)
        userAdapter.updateData(filtered)
        showEmpty(filteredUsersWithOrderCount.isEmpty())
        
        // Update filter button texts with counts
        updateFilterButtonCounts()
    }
    
    private fun updateFilterButtonCounts() {
        val totalUsers = usersWithOrderCount.size
        val activeUsers = usersWithOrderCount.count { !it.user.isBanned }
        val bannedUsers = usersWithOrderCount.count { it.user.isBanned }
        
        binding.btnFilterAll.text = "Semua ($totalUsers)"
        binding.btnFilterActive.text = "Aktif ($activeUsers)"
        binding.btnFilterBanned.text = "Banned ($bannedUsers)"
    }
    
    private fun viewUserDetails(user: User) {
        lifecycleScope.launch {
            try {
                // Get real order count from repository
                val orderCount = orderRepository.getOrderCountByUserId(user.id)
                val details = buildUserDetailsString(user, orderCount)
                Utils.showLongToast(this@UserManagementActivity, details)
            } catch (e: Exception) {
                Utils.showLongToast(this@UserManagementActivity, "Error memuat detail: ${e.message}")
            }
        }
    }
    
    private fun buildUserDetailsString(user: User, orderCount: Int): String {
        val sb = StringBuilder()
        sb.append("Nama: ${user.name}\n")
        sb.append("Email: ${user.email}\n")
        sb.append("Telepon: ${user.phone}\n")
        sb.append("Alamat: ${user.getFullAddress()}\n")
        sb.append("Total Pesanan: $orderCount\n")
        sb.append("Bergabung: ${user.createdAt?.toDate()?.toString() ?: "Tidak diketahui"}")
        
        return sb.toString()
    }
    
    private fun viewUserOrders(user: User) {
        lifecycleScope.launch {
            try {
                showLoading(true)
                
                // Get orders for this user from repository
                val userOrders = orderRepository.getOrdersByUserId(user.id)
                
                showLoading(false)
                
                if (userOrders.isEmpty()) {
                    Utils.showLongToast(this@UserManagementActivity, "Pengguna ini belum memiliki pesanan")
                    return@launch
                }
                
                // Show orders for this user
                val orderDetails = StringBuilder()
                orderDetails.append("Pesanan ${user.name}:\n\n")
                
                userOrders.forEachIndexed { index, order ->
                    orderDetails.append("${index + 1}. Order ID: ${order.id}\n")
                    orderDetails.append("   Status: ${order.status}\n")
                    orderDetails.append("   Total: Rp ${String.format("%,.0f", order.total)}\n")
                    orderDetails.append("   Tanggal: ${order.createdAt?.toDate()?.toString() ?: "Tidak diketahui"}\n\n")
                }
                
                Utils.showLongToast(this@UserManagementActivity, "Menampilkan ${userOrders.size} pesanan untuk ${user.name}")
                
                // Optional: Show in dialog or new activity
                androidx.appcompat.app.AlertDialog.Builder(this@UserManagementActivity)
                    .setTitle("Pesanan ${user.name}")
                    .setMessage(orderDetails.toString())
                    .setPositiveButton("OK", null)
                    .show()
                    
            } catch (e: Exception) {
                showLoading(false)
                Utils.showLongToast(this@UserManagementActivity, "Error memuat pesanan: ${e.message}")
            }
        }
    }
    
    private fun showBanDialog(user: User) {
        val editText = android.widget.EditText(this)
        editText.hint = "Masukkan alasan ban (opsional)"
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Ban User")
            .setMessage("Apakah Anda yakin ingin memban ${user.name}?\n\nUser yang di-ban tidak akan bisa menggunakan aplikasi.")
            .setView(editText)
            .setPositiveButton("Ban") { _, _ ->
                val reason = editText.text.toString().trim().takeIf { it.isNotEmpty() } ?: "Tidak ada alasan"
                banUser(user, reason)
            }
            .setNegativeButton("Batal", null)
            .show()
    }
    
    private fun confirmUnbanUser(user: User) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Unban User")
            .setMessage("Apakah Anda yakin ingin membatalkan ban untuk ${user.name}?\n\nUser akan dapat menggunakan aplikasi kembali.")
            .setPositiveButton("Unban") { _, _ ->
                unbanUser(user)
            }
            .setNegativeButton("Batal", null)
            .show()
    }
    
    private fun banUser(user: User, reason: String) {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                android.util.Log.d("UserManagement", "Attempting to ban user: ${user.name} (${user.id})")
                val success = userRepository.banUser(user.id, reason)
                
                if (success) {
                    android.util.Log.d("UserManagement", "Ban successful, reloading data")
                    Utils.showToast(this@UserManagementActivity, "${user.name} berhasil di-ban")
                    loadUsers() // Reload to show updated status
                } else {
                    android.util.Log.e("UserManagement", "Ban failed")
                    Utils.showToast(this@UserManagementActivity, "Gagal memban user")
                }
            } catch (e: Exception) {
                android.util.Log.e("UserManagement", "Ban error: ${e.message}")
                Utils.showToast(this@UserManagementActivity, "Error: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }
    
    private fun unbanUser(user: User) {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                android.util.Log.d("UserManagement", "Attempting to unban user: ${user.name} (${user.id})")
                val success = userRepository.unbanUser(user.id)
                
                if (success) {
                    android.util.Log.d("UserManagement", "Unban successful, reloading data")
                    Utils.showToast(this@UserManagementActivity, "${user.name} berhasil di-unban")
                    loadUsers() // Reload to show updated status
                } else {
                    android.util.Log.e("UserManagement", "Unban failed")
                    Utils.showToast(this@UserManagementActivity, "Gagal meng-unban user")
                }
            } catch (e: Exception) {
                android.util.Log.e("UserManagement", "Unban error: ${e.message}")
                Utils.showToast(this@UserManagementActivity, "Error: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.rvUsers.visibility = if (show) View.GONE else View.VISIBLE
    }
    
    private fun showEmpty(show: Boolean) {
        binding.layoutEmpty.visibility = if (show) View.VISIBLE else View.GONE
        binding.rvUsers.visibility = if (show) View.GONE else View.VISIBLE
    }
}
