package com.komputerkit.easyshop.model

import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Data class untuk item navigasi di Bottom Navigation Bar
 *
 * @property title Judul navigasi yang ditampilkan
 * @property icon Icon untuk item navigasi
 * @property route Route untuk navigasi (optional, untuk future implementation)
 */
data class NavItem(
    val title: String,
    val icon: ImageVector,
    val route: String = ""
)
