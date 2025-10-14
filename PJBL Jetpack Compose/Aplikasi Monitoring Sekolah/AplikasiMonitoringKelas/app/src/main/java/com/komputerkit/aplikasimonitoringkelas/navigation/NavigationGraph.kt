package com.komputerkit.aplikasimonitoringkelas.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.komputerkit.aplikasimonitoringkelas.screens.AbsenScreen
import com.komputerkit.aplikasimonitoringkelas.screens.HomeScreen
import com.komputerkit.aplikasimonitoringkelas.screens.JadwalScreen

@Composable
fun NavigationGraph(navController: NavHostController, modifier: Modifier = Modifier) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = modifier
    ) {
        composable(Screen.Home.route) {
            HomeScreen()
        }
        composable(Screen.Jadwal.route) {
            JadwalScreen()
        }
        composable(Screen.Absen.route) {
            AbsenScreen()
        }
    }
}
