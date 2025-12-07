package com.komputerkit.learnnavigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

/**
 * Composable utama untuk mengatur navigasi aplikasi
 * Menggunakan NavHost untuk mengelola perpindahan antar layar
 */
@Composable
fun MyAppNavigation(navController: NavHostController = rememberNavController()) {
    NavHost(
        navController = navController,
        startDestination = Routes.ScreenA
    ) {
        // Definisi route untuk Screen A
        composable(Routes.ScreenA) {
            ScreenA(navController = navController)
        }
        
        // Definisi route untuk Screen B dengan parameter nama
        composable("${Routes.ScreenB}/{name}") { backStackEntry ->
            // Ekstrak argumen nama dari navigation arguments
            val name = backStackEntry.arguments?.getString("name")
            ScreenB(name = name)
        }
    }
}