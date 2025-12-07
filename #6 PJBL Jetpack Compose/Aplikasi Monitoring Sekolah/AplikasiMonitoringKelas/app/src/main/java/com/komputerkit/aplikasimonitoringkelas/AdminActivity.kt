package com.komputerkit.aplikasimonitoringkelas

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.komputerkit.aplikasimonitoringkelas.admin.screens.EntriJadwalScreen
import com.komputerkit.aplikasimonitoringkelas.admin.screens.EntriUserScreen
import com.komputerkit.aplikasimonitoringkelas.admin.screens.ListAdminScreen
import com.komputerkit.aplikasimonitoringkelas.api.TokenManager
import com.komputerkit.aplikasimonitoringkelas.ui.theme.AplikasiMonitoringKelasTheme

sealed class AdminNavigation(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object EntriJadwal : AdminNavigation("entri_jadwal", "Entri Jadwal", Icons.Default.Add)
    object EntriUser : AdminNavigation("entri_user", "Entri User", Icons.Default.Person)
    object List : AdminNavigation("list", "List", Icons.Default.List)
}

class AdminActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val role = intent.getStringExtra("ROLE") ?: "admin"
        val email = intent.getStringExtra("EMAIL") ?: "admin@sekolah.com"
        val name = intent.getStringExtra("NAME") ?: "Admin"
        
        setContent {
            AplikasiMonitoringKelasTheme {
                AdminScreen(
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

@Composable
fun AdminScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val navController = rememberNavController()
    val items = listOf(AdminNavigation.EntriJadwal, AdminNavigation.EntriUser, AdminNavigation.List)
    
    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route
                
                items.forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label) },
                        selected = currentRoute == item.route,
                        onClick = { navController.navigate(item.route) { launchSingleTop = true } }
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(navController, startDestination = AdminNavigation.EntriJadwal.route, Modifier.padding(paddingValues)) {
            composable(AdminNavigation.EntriJadwal.route) { EntriJadwalScreen(role, email, name, onLogout) }
            composable(AdminNavigation.EntriUser.route) { EntriUserScreen(role, email, name, onLogout) }
            composable(AdminNavigation.List.route) { ListAdminScreen(role, email, name, onLogout) }
        }
    }
}
