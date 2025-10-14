package com.komputerkit.wavesoffoodadmin.activity

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.wavesoffoodadmin.Utils
import com.komputerkit.wavesoffoodadmin.adapter.FoodAdapter
import com.komputerkit.wavesoffoodadmin.databinding.ActivityMenuManagementBinding
import com.komputerkit.wavesoffoodadmin.model.MenuItem
import com.komputerkit.wavesoffoodadmin.repository.FoodRepository
import kotlinx.coroutines.launch

class MenuManagementActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMenuManagementBinding
    private lateinit var foodAdapter: FoodAdapter
    private val foodRepository = FoodRepository()
    private val foods = mutableListOf<MenuItem>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMenuManagementBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()
        setupRecyclerView()
        setupClickListeners()
        loadFoods()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }
    
    private fun setupRecyclerView() {
        foodAdapter = FoodAdapter(foods) { food, action ->
            when (action) {
                "edit" -> editFood(food)
                "delete" -> deleteFood(food)
                "toggle_availability" -> toggleAvailability(food)
            }
        }
        
        binding.rvFoods.apply {
            adapter = foodAdapter
            layoutManager = LinearLayoutManager(this@MenuManagementActivity)
        }
    }
    
    private fun setupClickListeners() {
        binding.fabAddFood.setOnClickListener {
            startActivity(Intent(this, AddEditFoodActivity::class.java))
        }
    }
    
    private fun loadFoods() {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                // First, migrate any data with incorrect field names
                foodRepository.migrateAvailabilityFields()
                
                // Then load all foods
                val foodList = foodRepository.getAllFoods()
                
                foods.clear()
                foods.addAll(foodList)
                foodAdapter.notifyDataSetChanged()
                
                showEmpty(foods.isEmpty())
                
            } catch (e: Exception) {
                Utils.showLongToast(this@MenuManagementActivity, "Gagal memuat data menu: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }
    
    private fun editFood(food: MenuItem) {
        val intent = Intent(this, AddEditFoodActivity::class.java)
        intent.putExtra("food_id", food.id)
        startActivity(intent)
    }
    
    private fun deleteFood(food: MenuItem) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Hapus Menu")
            .setMessage("Apakah Anda yakin ingin menghapus '${food.name}'?")
            .setPositiveButton("Hapus") { _, _ ->
                lifecycleScope.launch {
                    val success = foodRepository.deleteFood(food.id)
                    if (success) {
                        Utils.showToast(this@MenuManagementActivity, "Menu berhasil dihapus")
                        loadFoods()
                    } else {
                        Utils.showToast(this@MenuManagementActivity, "Gagal menghapus menu")
                    }
                }
            }
            .setNegativeButton("Batal", null)
            .show()
    }
    
    private fun toggleAvailability(food: MenuItem) {
        android.util.Log.d("MenuManagement", "Toggle availability for ${food.name}, current: ${food.isAvailable}")
        
        lifecycleScope.launch {
            try {
                val newAvailability = !food.isAvailable
                android.util.Log.d("MenuManagement", "Updating ${food.name} availability to: $newAvailability")
                
                val success = foodRepository.updateFoodAvailability(food.id, newAvailability)
                
                if (success) {
                    // Refresh the list to get updated data from server
                    loadFoods()
                    
                    val status = if (newAvailability) "tersedia" else "tidak tersedia"
                    Utils.showToast(this@MenuManagementActivity, "${food.name} sekarang $status")
                    
                    // Refresh data to ensure consistency
                    loadFoods()
                } else {
                    Utils.showToast(this@MenuManagementActivity, "Gagal mengubah status menu")
                }
            } catch (e: Exception) {
                android.util.Log.e("MenuManagement", "Error toggling availability", e)
                Utils.showToast(this@MenuManagementActivity, "Error: ${e.message}")
            }
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.rvFoods.visibility = if (show) View.GONE else View.VISIBLE
    }
    
    private fun showEmpty(show: Boolean) {
        binding.layoutEmpty.visibility = if (show) View.VISIBLE else View.GONE
        binding.rvFoods.visibility = if (show) View.GONE else View.VISIBLE
    }
    
    override fun onResume() {
        super.onResume()
        loadFoods()
    }
}
