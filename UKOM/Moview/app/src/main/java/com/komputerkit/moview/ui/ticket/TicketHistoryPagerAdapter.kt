package com.komputerkit.moview.ui.ticket

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter

class TicketHistoryPagerAdapter(activity: FragmentActivity) : FragmentStateAdapter(activity) {

    override fun getItemCount(): Int = 2

    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> TicketHistoryTabFragment.newInstance(TicketHistoryTabFragment.TAB_ACTIVE)
            1 -> TicketHistoryTabFragment.newInstance(TicketHistoryTabFragment.TAB_HISTORY)
            else -> throw IllegalStateException("Invalid tab position: $position")
        }
    }
}
