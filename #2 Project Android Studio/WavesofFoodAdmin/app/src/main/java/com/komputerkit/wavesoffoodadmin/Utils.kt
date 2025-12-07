package com.komputerkit.wavesoffoodadmin

import android.content.Context
import android.widget.Toast
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object Utils {
    
    fun showToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
    
    fun showLongToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    }
    
    fun formatPrice(price: Double): String {
        return "Rp ${String.format("%,.0f", price)}"
    }
    
    fun formatDate(timestamp: Long): String {
        val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
    
    fun formatDateOnly(timestamp: Long): String {
        val sdf = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
    
    fun formatTimeOnly(timestamp: Long): String {
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
    
    fun getOrderStatusColor(status: String): Int {
        return when (status.uppercase()) {
            "PENDING" -> android.R.color.holo_orange_dark
            "CONFIRMED" -> android.R.color.holo_blue_dark
            "PREPARING" -> android.R.color.holo_purple
            "READY" -> android.R.color.holo_green_dark
            "DELIVERED" -> android.R.color.holo_green_light
            "CANCELLED" -> android.R.color.holo_red_dark
            else -> android.R.color.darker_gray
        }
    }
    
    fun getOrderStatusText(status: String): String {
        return when (status.uppercase()) {
            "PENDING" -> "Menunggu Konfirmasi"
            "CONFIRMED" -> "Dikonfirmasi"
            "PREPARING" -> "Sedang Dimasak"
            "READY" -> "Siap Diambil"
            "DELIVERED" -> "Selesai"
            "CANCELLED" -> "Dibatalkan"
            else -> status
        }
    }
}
