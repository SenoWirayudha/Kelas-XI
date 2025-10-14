package com.komputerkit.easyshop.ui.checkout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Composable function untuk menampilkan ringkasan harga checkout
 * dengan subtotal, diskon, pajak, dan total akhir
 *
 * @param subtotal Nilai awal sebelum diskon dan pajak
 */
@Composable
fun CheckoutPriceSummary(subtotal: Float) {
    // Konstanta untuk persentase diskon dan pajak
    val discountPercentage = 10f // 10% diskon
    val taxPercentage = 13f // 13% pajak (PPN Indonesia 11% + pembulatan)
    
    // Hitung diskon dan pajak
    val discountAmount = subtotal * (discountPercentage / 100f)
    val taxAmount = subtotal * (taxPercentage / 100f)
    
    // Hitung total akhir
    val finalTotal = subtotal - discountAmount + taxAmount
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "Ringkasan Harga",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Subtotal
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Subtotal",
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = "Rp ${String.format("%,.2f", subtotal)}",
                style = MaterialTheme.typography.bodyLarge
            )
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Diskon
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Diskon ($discountPercentage%)",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.error
            )
            Text(
                text = "- Rp ${String.format("%,.2f", discountAmount)}",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.error
            )
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Pajak
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Pajak ($taxPercentage%)",
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = "Rp ${String.format("%,.2f", taxAmount)}",
                style = MaterialTheme.typography.bodyLarge
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Divider pertama
        HorizontalDivider()
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Total Akhir
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Total Akhir",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Rp ${String.format("%,.2f", finalTotal)}",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Divider kedua
        HorizontalDivider()
    }
}
