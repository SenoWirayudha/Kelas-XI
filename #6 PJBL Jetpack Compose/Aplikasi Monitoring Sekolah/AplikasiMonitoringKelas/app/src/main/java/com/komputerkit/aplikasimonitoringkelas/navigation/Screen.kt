package com.komputerkit.aplikasimonitoringkelas.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Jadwal : Screen("jadwal")
    object Absen : Screen("absen")
}
