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
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.List
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
import com.komputerkit.aplikasimonitoringkelas.siswa.screens.EntriScreen
import com.komputerkit.aplikasimonitoringkelas.siswa.screens.JadwalPelajaranScreen
import com.komputerkit.aplikasimonitoringkelas.siswa.screens.ListScreen
import com.komputerkit.aplikasimonitoringkelas.ui.theme.AplikasiMonitoringKelasTheme

class SiswaActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Get data from intent
        val role = intent.getStringExtra("ROLE") ?: "siswa"
        val email = intent.getStringExtra("EMAIL") ?: ""
        val name = intent.getStringExtra("NAME") ?: "Siswa"
        
        setContent {
            AplikasiMonitoringKelasTheme {
                SiswaMainScreen(
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

// Sealed class untuk navigation routes
sealed class SiswaScreen(val route: String, val title: String, val icon: ImageVector) {
    object JadwalPelajaran : SiswaScreen("jadwal_pelajaran", "Jadwal", Icons.Default.DateRange)
    object Entri : SiswaScreen("entri", "Entri", Icons.Default.Edit)
    object List : SiswaScreen("list", "List", Icons.Default.List)
}

@Composable
fun SiswaMainScreen(
    role: String, 
    email: String, 
    name: String,
    onLogout: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val screens = listOf(
        SiswaScreen.JadwalPelajaran,
        SiswaScreen.Entri,
        SiswaScreen.List
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
            startDestination = SiswaScreen.JadwalPelajaran.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(SiswaScreen.JadwalPelajaran.route) {
                JadwalPelajaranScreen(
                    role = role, 
                    email = email, 
                    name = name,
                    onLogout = onLogout
                )
            }
            composable(SiswaScreen.Entri.route) {
                EntriScreen(
                    role = role, 
                    email = email,
                    name = name,
                    onLogout = onLogout
                )
            }
            composable(SiswaScreen.List.route) {
                ListScreen(
                    role = role, 
                    email = email,
                    name = name,
                    onLogout = onLogout
                )
            }
        }
    }
}
