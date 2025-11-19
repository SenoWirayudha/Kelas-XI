package com.komputerkit.whatsapp.adapters

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.komputerkit.whatsapp.fragments.CallFragment
import com.komputerkit.whatsapp.fragments.ChatFragment
import com.komputerkit.whatsapp.fragments.StatusFragment

/**
 * Adapter untuk ViewPager2 di HomeActivity
 */
class ViewPagerAdapter(fragmentActivity: FragmentActivity) : FragmentStateAdapter(fragmentActivity) {
    
    override fun getItemCount(): Int = 3 // Chat, Status, Telepon
    
    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> ChatFragment()
            1 -> StatusFragment()
            2 -> CallFragment()
            else -> ChatFragment()
        }
    }
}
