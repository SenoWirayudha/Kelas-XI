package com.komputerkit.learnnavigation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.komputerkit.learnnavigation.ui.theme.LearnNavigationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LearnNavigationTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    // Menggunakan MyAppNavigation sebagai konten utama
                    MyAppNavigation()
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun NavigationPreview() {
    LearnNavigationTheme {
        MyAppNavigation()
    }
}