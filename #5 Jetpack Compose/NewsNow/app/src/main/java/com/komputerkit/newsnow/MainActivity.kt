package com.komputerkit.newsnow

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.komputerkit.newsnow.navigation.NewsNavigation
import com.komputerkit.newsnow.ui.theme.NewsNowTheme
import com.komputerkit.newsnow.utils.GlobalExceptionHandler
import com.komputerkit.newsnow.utils.Logger
import com.komputerkit.newsnow.viewmodel.NewsViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Install global exception handler untuk catch crashes
        GlobalExceptionHandler.install(applicationContext)
        
        // Log app start
        Logger.i("App started")
        
        enableEdgeToEdge()
        setContent {
            NewsNowTheme {
                val navController = rememberNavController()
                val newsViewModel: NewsViewModel = viewModel()
                
                NewsNavigation(
                    navController = navController,
                    newsViewModel = newsViewModel
                )
            }
        }
    }
    
    override fun onDestroy() {
        Logger.i("App destroyed")
        super.onDestroy()
    }
}