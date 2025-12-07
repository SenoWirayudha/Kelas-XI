package com.komputerkit.whatsapp

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.tabs.TabLayoutMediator
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.whatsapp.adapters.ViewPagerAdapter
import com.komputerkit.whatsapp.databinding.ActivityHomeBinding

/**
 * Home Activity dengan TabLayout untuk Chat, Status, dan Telepon
 */
class HomeActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityHomeBinding
    private lateinit var auth: FirebaseAuth
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
        
        // Check if user is logged in
        if (auth.currentUser == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        // Setup Toolbar
        setSupportActionBar(binding.toolbar)
        
        // Setup ViewPager with Fragments
        setupViewPager()
        
        // Setup FAB
        setupFAB()
    }
    
    private fun setupViewPager() {
        val adapter = ViewPagerAdapter(this)
        binding.viewPager.adapter = adapter
        
        // Connect TabLayout with ViewPager2
        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            tab.text = when (position) {
                0 -> "Chat"
                1 -> "Status"
                2 -> "Telepon"
                else -> "Tab $position"
            }
        }.attach()
    }
    
    private fun setupFAB() {
        binding.fabNewChat.setOnClickListener {
            // TODO: Open user list to start new chat
            // For now, show toast
            android.widget.Toast.makeText(
                this,
                "Fitur chat baru akan segera hadir",
                android.widget.Toast.LENGTH_SHORT
            ).show()
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_home, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_search -> {
                // TODO: Implement search
                android.widget.Toast.makeText(this, "Search", android.widget.Toast.LENGTH_SHORT).show()
                true
            }
            R.id.action_insert_dummy -> {
                insertDummyData()
                true
            }
            R.id.action_delete_dummy -> {
                deleteDummyData()
                true
            }
            R.id.action_settings -> {
                // TODO: Open settings
                android.widget.Toast.makeText(this, "Settings", android.widget.Toast.LENGTH_SHORT).show()
                true
            }
            R.id.action_logout -> {
                logout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun insertDummyData() {
        android.app.AlertDialog.Builder(this)
            .setTitle("Insert Dummy Data")
            .setMessage("Ini akan menambahkan 5 dummy users dan beberapa chat rooms. Lanjutkan?")
            .setPositiveButton("Ya") { _, _ ->
                com.komputerkit.whatsapp.utils.DummyDataHelper.insertAllDummyData()
                android.widget.Toast.makeText(
                    this,
                    "Inserting dummy data... Tunggu 3 detik lalu refresh",
                    android.widget.Toast.LENGTH_LONG
                ).show()
            }
            .setNegativeButton("Batal", null)
            .show()
    }
    
    private fun deleteDummyData() {
        android.app.AlertDialog.Builder(this)
            .setTitle("Delete Dummy Data")
            .setMessage("Ini akan menghapus semua dummy users dan chat rooms. Lanjutkan?")
            .setPositiveButton("Ya") { _, _ ->
                com.komputerkit.whatsapp.utils.DummyDataHelper.deleteDummyData()
                android.widget.Toast.makeText(
                    this,
                    "Deleting dummy data...",
                    android.widget.Toast.LENGTH_SHORT
                ).show()
            }
            .setNegativeButton("Batal", null)
            .show()
    }
    
    private fun logout() {
        auth.signOut()
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
}
