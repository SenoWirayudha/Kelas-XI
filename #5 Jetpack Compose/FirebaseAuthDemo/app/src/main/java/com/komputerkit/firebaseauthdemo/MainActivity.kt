package com.komputerkit.firebaseauthdemo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.komputerkit.firebaseauthdemo.ui.auth.AuthState
import com.komputerkit.firebaseauthdemo.ui.auth.AuthViewModel
import com.komputerkit.firebaseauthdemo.ui.components.ErrorScreen
import com.komputerkit.firebaseauthdemo.ui.components.LoadingScreen
import com.komputerkit.firebaseauthdemo.ui.navigation.UnauthenticatedScreen
import com.komputerkit.firebaseauthdemo.ui.screens.HomeScreen
import com.komputerkit.firebaseauthdemo.ui.screens.LoginScreen
import com.komputerkit.firebaseauthdemo.ui.screens.RegisterScreen
import com.komputerkit.firebaseauthdemo.ui.theme.FirebaseAuthDemoTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FirebaseAuthDemoTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    MainApp(modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }
}

@Composable
fun MainApp(
    modifier: Modifier = Modifier,
    authViewModel: AuthViewModel = viewModel()
) {
    val authState by authViewModel.authState.observeAsState()
    var currentScreen by remember { mutableStateOf(UnauthenticatedScreen.LOGIN) }
    
    when (authState) {
        is AuthState.Loading -> {
            LoadingScreen(modifier = modifier)
        }
        
        is AuthState.Authenticated -> {
            HomeScreen(
                authViewModel = authViewModel,
                modifier = modifier
            )
        }
        
        is AuthState.Unauthenticated -> {
            when (currentScreen) {
                UnauthenticatedScreen.LOGIN -> {
                    LoginScreen(
                        authViewModel = authViewModel,
                        onNavigateToRegister = {
                            currentScreen = UnauthenticatedScreen.REGISTER
                        },
                        modifier = modifier
                    )
                }
                
                UnauthenticatedScreen.REGISTER -> {
                    RegisterScreen(
                        authViewModel = authViewModel,
                        onNavigateToLogin = {
                            currentScreen = UnauthenticatedScreen.LOGIN
                        },
                        modifier = modifier
                    )
                }
            }
        }
        
        is AuthState.Error -> {
            ErrorScreen(
                errorMessage = (authState as AuthState.Error).message,
                onRetry = {
                    // Reset ke state unauthenticated untuk kembali ke login screen
                    authViewModel.signout()
                    currentScreen = UnauthenticatedScreen.LOGIN
                },
                modifier = modifier
            )
        }
        
        null -> {
            LoadingScreen(modifier = modifier)
        }
    }
}