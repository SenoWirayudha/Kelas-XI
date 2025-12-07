package com.komputerkit.stateexample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.komputerkit.stateexample.ui.theme.StateExampleTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StateExampleTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    StateTestScreen(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun StateTestScreen(modifier: Modifier = Modifier) {
    val viewModel: StateTestViewModel = viewModel()
    val name by viewModel.name.observeAsState(initial = "")
    val surname by viewModel.surname.observeAsState(initial = "")
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        MyText(name = name, surname = surname)
        
        MyTextField(
            value = name,
            onValueChange = { viewModel.onNameUpdate(it) },
            label = "Masukkan nama depan"
        )
        
        MyTextField(
            value = surname,
            onValueChange = { viewModel.onSurnameUpdate(it) },
            label = "Masukkan nama belakang"
        )
    }
}

@Composable
fun MyText(name: String, surname: String = "") {
    val displayText = when {
        name.isNotBlank() && surname.isNotBlank() -> "Halo $name $surname"
        name.isNotBlank() -> "Halo $name"
        surname.isNotBlank() -> "Halo $surname"
        else -> "Halo [nama pengguna]"
    }
    
    Text(
        text = displayText,
        fontSize = 24.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(bottom = 16.dp)
    )
}

@Composable
fun MyTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String = "Masukkan nama"
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    )
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    StateExampleTheme {
        Greeting("Android")
    }
}

@Preview(showBackground = true)
@Composable
fun StateTestScreenPreview() {
    StateExampleTheme {
        StateTestScreen()
    }
}