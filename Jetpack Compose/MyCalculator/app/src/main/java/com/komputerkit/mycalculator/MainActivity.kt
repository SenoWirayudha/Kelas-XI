package com.komputerkit.mycalculator

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.mycalculator.ui.theme.MyCalculatorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyCalculatorTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    CalculatorApp(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun CalculatorApp(modifier: Modifier = Modifier) {
    // State untuk menyimpan input angka
    var number1 by remember { mutableStateOf("") }
    var number2 by remember { mutableStateOf("") }
    
    val context = LocalContext.current
    
    // Fungsi untuk melakukan operasi dan menampilkan hasil dalam Toast
    fun performOperation(operation: String) {
        try {
            val num1 = number1.toDoubleOrNull()
            val num2 = number2.toDoubleOrNull()
            
            if (num1 == null || num2 == null) {
                Toast.makeText(context, "Masukkan angka yang valid!", Toast.LENGTH_SHORT).show()
                return
            }
            
            val result = when (operation) {
                "+" -> num1 + num2
                "-" -> num1 - num2
                "×" -> num1 * num2
                "÷" -> {
                    if (num2 == 0.0) {
                        Toast.makeText(context, "Tidak dapat membagi dengan nol!", Toast.LENGTH_SHORT).show()
                        return
                    }
                    num1 / num2
                }
                else -> 0.0
            }
            
            val resultText = if (result == result.toInt().toDouble()) {
                "Hasil: ${result.toInt()}"
            } else {
                "Hasil: ${"%.2f".format(result)}"
            }
            
            Toast.makeText(context, resultText, Toast.LENGTH_LONG).show()
            
        } catch (e: Exception) {
            Toast.makeText(context, "Terjadi kesalahan!", Toast.LENGTH_SHORT).show()
        }
    }
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Judul aplikasi
        Text(
            text = "Kalkulator Dasar",
            fontSize = 24.sp,
            style = MaterialTheme.typography.headlineMedium
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // TextField untuk angka pertama
        OutlinedTextField(
            value = number1,
            onValueChange = { number1 = it },
            label = { Text("Angka Pertama") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // TextField untuk angka kedua
        OutlinedTextField(
            value = number2,
            onValueChange = { number2 = it },
            label = { Text("Angka Kedua") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Row untuk tombol-tombol operasi
        Row(
            horizontalArrangement = Arrangement.SpaceEvenly,
            modifier = Modifier.fillMaxWidth()
        ) {
            // Tombol Penjumlahan
            Button(
                onClick = { performOperation("+") },
                modifier = Modifier.weight(1f)
            ) {
                Text("+", fontSize = 18.sp)
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // Tombol Pengurangan
            Button(
                onClick = { performOperation("-") },
                modifier = Modifier.weight(1f)
            ) {
                Text("-", fontSize = 18.sp)
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            horizontalArrangement = Arrangement.SpaceEvenly,
            modifier = Modifier.fillMaxWidth()
        ) {
            // Tombol Perkalian
            Button(
                onClick = { performOperation("×") },
                modifier = Modifier.weight(1f)
            ) {
                Text("×", fontSize = 18.sp)
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // Tombol Pembagian
            Button(
                onClick = { performOperation("÷") },
                modifier = Modifier.weight(1f)
            ) {
                Text("÷", fontSize = 18.sp)
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun CalculatorAppPreview() {
    MyCalculatorTheme {
        CalculatorApp()
    }
}