package com.komputerkit.aplikasimonitoringkelas

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.komputerkit.aplikasimonitoringkelas.api.TokenManager
import com.komputerkit.aplikasimonitoringkelas.kepalasekolah.screens.JadwalPelajaranKepsekScreen
import com.komputerkit.aplikasimonitoringkelas.kepalasekolah.screens.KelasKosongScreen
import com.komputerkit.aplikasimonitoringkelas.kepalasekolah.screens.ListKepsekScreen
import com.komputerkit.aplikasimonitoringkelas.ui.theme.AplikasiMonitoringKelasTheme

class KepalaSekolahActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        val role = intent.getStringExtra("ROLE") ?: "kepala_sekolah"
        val email = intent.getStringExtra("EMAIL") ?: ""
        val name = intent.getStringExtra("NAME") ?: "Kepala Sekolah"
        
        setContent {
            AplikasiMonitoringKelasTheme {
                KepalaSekolahMainScreen(
                    role = role, 
                    email = email,
                    name = name,
                    onLogout = {
                        // Clear token and navigate back to login
                        val tokenManager = TokenManager(this)
                        tokenManager.clearAll()
                        
                        val intent = Intent(this, LoginActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    }
                )
            }
        }
    }
}

sealed class KepsekScreen(val route: String, val title: String, val icon: ImageVector) {
    object JadwalPelajaran : KepsekScreen("jadwal_pelajaran", "Jadwal", Icons.Default.DateRange)
    object KelasKosong : KepsekScreen("kelas_kosong", "Kelas Kosong", Icons.Default.Home)
    object List : KepsekScreen("list", "List", Icons.Default.List)
}

@Composable
fun KepalaSekolahMainScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val screens = listOf(
        KepsekScreen.JadwalPelajaran,
        KepsekScreen.KelasKosong,
        KepsekScreen.List
    )

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar {
                screens.forEach { screen ->
                    NavigationBarItem(
                        icon = { 
                            Icon(
                                imageVector = screen.icon,
                                contentDescription = screen.title
                            )
                        },
                        label = { Text(screen.title) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = KepsekScreen.JadwalPelajaran.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(KepsekScreen.JadwalPelajaran.route) {
                JadwalPelajaranKepsekScreen(role = role, email = email, name = name, onLogout = onLogout)
            }
            composable(KepsekScreen.KelasKosong.route) {
                KelasKosongScreen(role = role, email = email, name = name, onLogout = onLogout)
            }
            composable(KepsekScreen.List.route) {
                ListKepsekScreen(role = role, email = email, name = name, onLogout = onLogout)
            }
        }
    }
}
