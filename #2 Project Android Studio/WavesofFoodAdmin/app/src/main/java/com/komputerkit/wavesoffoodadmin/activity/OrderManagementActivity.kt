package com.komputerkit.wavesoffoodadmin.activity

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.google.android.material.tabs.TabLayoutMediator
import com.komputerkit.wavesoffoodadmin.FirebaseHelper
import com.komputerkit.wavesoffoodadmin.databinding.ActivityOrderManagementBinding
import com.komputerkit.wavesoffoodadmin.fragment.OrderListFragment
import com.komputerkit.wavesoffoodadmin.model.OrderStatus

class OrderManagementActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityOrderManagementBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOrderManagementBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()
        setupViewPager()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }
    
    private fun setupViewPager() {
        val adapter = OrderPagerAdapter(this)
        binding.viewPager.adapter = adapter
        
        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            tab.text = when (position) {
                0 -> "Menunggu"
                1 -> "Diproses"
                2 -> "Siap"
                3 -> "Terkirim"
                4 -> "Dibatalkan"
                else -> "Tab ${position + 1}"
            }
        }.attach()
    }
    
    private inner class OrderPagerAdapter(fa: FragmentActivity) : FragmentStateAdapter(fa) {
        
        override fun getItemCount(): Int = 5
        
        override fun createFragment(position: Int): Fragment {
            val status = when (position) {
                0 -> OrderStatus.PENDING.value
                1 -> OrderStatus.PREPARING.value
                2 -> OrderStatus.READY.value
                3 -> OrderStatus.DELIVERED.value
                4 -> OrderStatus.CANCELLED.value
                else -> OrderStatus.PENDING.value
            }
            
            return OrderListFragment.newInstance(status)
        }
    }
}
