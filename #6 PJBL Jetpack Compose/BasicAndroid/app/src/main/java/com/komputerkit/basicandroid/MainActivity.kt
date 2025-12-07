package com.komputerkit.basicandroid

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.basicandroid.ui.theme.BasicAndroidTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BasicAndroidTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    FormulirPengguna(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun FormulirPengguna(modifier: Modifier = Modifier) {
    var nama by remember { mutableStateOf("") }
    var alamat by remember { mutableStateOf("") }
    var pesan by remember { mutableStateOf("") }
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Image
        Image(
            painter = painterResource(id = R.drawable.ic_launcher_foreground),
            contentDescription = "Logo",
            modifier = Modifier.size(120.dp)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Text Nama
        Text(
            text = "Nama",
            fontSize = 16.sp
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // TextField Nama
        OutlinedTextField(
            value = nama,
            onValueChange = { nama = it },
            label = { Text("Masukkan Nama") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Text Alamat
        Text(
            text = "Alamat",
            fontSize = 16.sp
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // TextField Alamat
        OutlinedTextField(
            value = alamat,
            onValueChange = { alamat = it },
            label = { Text("Masukkan Alamat") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Button Simpan
        Button(
            onClick = { 
                pesan = "Nama: $nama\nAlamat: $alamat"
            }
        ) {
            Text("Simpan")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Tampilkan Pesan
        if (pesan.isNotEmpty()) {
            Text(
                text = pesan,
                fontSize = 16.sp,
                modifier = Modifier.padding(16.dp)
            )
        }
    }
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
    BasicAndroidTheme {
        Greeting("Android")
    }
}