package com.komputerkit.cgpaapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.komputerkit.cgpaapp.screen.CgpaCalculatorScreen
import com.komputerkit.cgpaapp.ui.theme.CGPAAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CGPAAppTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    CgpaCalculatorScreen()
                }
            }
        }
    }
}