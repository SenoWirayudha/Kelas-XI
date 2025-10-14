package com.komputerkit.wavesoffoodadmin.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.komputerkit.wavesoffoodadmin.R
import com.komputerkit.wavesoffoodadmin.databinding.ItemUserBinding
import com.komputerkit.wavesoffoodadmin.model.User
import com.komputerkit.wavesoffoodadmin.model.UserWithOrderCount

class UserAdapter(
    private val usersWithOrderCount: MutableList<UserWithOrderCount>,
    private val onItemAction: (User, String) -> Unit
) : RecyclerView.Adapter<UserAdapter.UserViewHolder>() {

    fun updateData(newData: List<UserWithOrderCount>) {
        usersWithOrderCount.clear()
        usersWithOrderCount.addAll(newData)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val binding = ItemUserBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return UserViewHolder(binding)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        holder.bind(usersWithOrderCount[position])
    }

    override fun getItemCount(): Int = usersWithOrderCount.size

    inner class UserViewHolder(private val binding: ItemUserBinding) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(userWithOrderCount: UserWithOrderCount) {
            val user = userWithOrderCount.user
            val orderCount = userWithOrderCount.orderCount
            
            android.util.Log.d("UserAdapter", "Binding user: ${user.name}, isBanned: ${user.isBanned}")
            
            binding.apply {
                tvUserName.text = user.name.takeIf { it.isNotEmpty() } ?: "No Name"
                tvUserEmail.text = user.email.takeIf { it.isNotEmpty() } ?: "No Email"
                tvUserPhone.text = user.getPhoneNumber().takeIf { !it.isNullOrEmpty() } ?: "No Phone"
                
                tvOrderCount.text = "$orderCount pesanan"
                
                // Show banned status
                if (user.isBanned) {
                    android.util.Log.d("UserAdapter", "User ${user.name} is BANNED")
                    tvUserStatus.text = "🚫 BANNED"
                    tvUserStatus.setTextColor(android.graphics.Color.RED)
                    tvUserStatus.visibility = android.view.View.VISIBLE
                    
                    if (user.banReason.isNotEmpty()) {
                        tvBanReason.text = "Alasan: ${user.banReason}"
                        tvBanReason.visibility = android.view.View.VISIBLE
                    } else {
                        tvBanReason.visibility = android.view.View.GONE
                    }
                } else {
                    android.util.Log.d("UserAdapter", "User ${user.name} is ACTIVE")
                    tvUserStatus.text = "✅ ACTIVE"
                    tvUserStatus.setTextColor(android.graphics.Color.parseColor("#4CAF50"))
                    tvUserStatus.visibility = android.view.View.VISIBLE
                    tvBanReason.visibility = android.view.View.GONE
                }
                
                // Load profile image with Glide
                Glide.with(itemView.context)
                    .load(user.profileImage.takeIf { it.isNotEmpty() })
                    .placeholder(R.drawable.ic_launcher_foreground)
                    .error(R.drawable.ic_launcher_foreground)
                    .circleCrop()
                    .into(ivProfileImage)
                
                // Button actions
                btnViewDetails.setOnClickListener {
                    onItemAction(user, "view_details")
                }
                
                btnViewOrders.setOnClickListener {
                    onItemAction(user, "view_orders")
                }
                
                // Ban/Unban button
                if (user.isBanned) {
                    btnBanUnban.text = "Unban"
                    btnBanUnban.setBackgroundColor(android.graphics.Color.parseColor("#4CAF50"))
                } else {
                    btnBanUnban.text = "Ban"
                    btnBanUnban.setBackgroundColor(android.graphics.Color.parseColor("#F44336"))
                }
                
                btnBanUnban.setOnClickListener {
                    if (user.isBanned) {
                        onItemAction(user, "unban")
                    } else {
                        onItemAction(user, "ban")
                    }
                }
            }
        }
    }
}
