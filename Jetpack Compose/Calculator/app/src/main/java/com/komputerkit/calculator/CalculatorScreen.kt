package com.komputerkit.calculator

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun CalculatorScreen(
    viewModel: CalculatorViewModel = viewModel()
) {
    val equationText by viewModel.equationText.collectAsState()
    val resultText by viewModel.resultText.collectAsState()
    
    // Definisi daftar tombol kalkulator
    val calculatorButtons = listOf(
        "AC", "(", ")", "/",
        "7", "8", "9", "*",
        "4", "5", "6", "-",
        "1", "2", "3", "+",
        "C", "0", ".", "="
    )
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Bottom
    ) {
        // Tampilan Persamaan/Hasil
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.End
            ) {
                // Tampilan Persamaan
                Text(
                    text = equationText.ifEmpty { "0" },
                    fontSize = 24.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Tampilan Hasil
                Text(
                    text = resultText,
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 1
                )
            }
        }
        
        // Spacer untuk mendorong tombol ke bagian bawah
        Spacer(modifier = Modifier.weight(1f))
        
        // Grid Tombol
        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(calculatorButtons) { symbol ->
                CalculatorButton(
                    symbol = symbol,
                    onClick = { viewModel.onButtonClick(symbol) }
                )
            }
        }
    }
}

@Composable
fun CalculatorButton(
    symbol: String,
    onClick: () -> Unit
) {
    // Pewarnaan Dinamis berdasarkan jenis tombol
    val buttonColors = when {
        // Tombol 'AC' / 'C' (Merah/Oranye/Abu-abu gelap)
        symbol in listOf("AC", "C") -> ButtonDefaults.buttonColors(
            containerColor = Color(0xFFFF6B35), // Oranye kemerahan
            contentColor = Color.White
        )
        // Tombol Operator (+, -, *, /, =) (Warna sekunder/Aksen)
        symbol in listOf("+", "-", "*", "/", "=", "(", ")") -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.secondary,
            contentColor = MaterialTheme.colorScheme.onSecondary
        )
        // Tombol Angka (Warna default/Latar belakang)
        else -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
            contentColor = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
    
    // Ukuran font yang disesuaikan
    val fontSize = when {
        symbol.length > 1 -> 16.sp // Untuk "AC"
        else -> 24.sp
    }
    
    Button(
        onClick = onClick,
        modifier = Modifier
            .size(72.dp)
            .aspectRatio(1f),
        shape = CircleShape,
        colors = buttonColors,
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 6.dp,
            pressedElevation = 12.dp
        ),
        contentPadding = PaddingValues(0.dp)
    ) {
        Text(
            text = symbol,
            fontSize = fontSize,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
    }
}

@Preview(showBackground = true)
@Composable
fun CalculatorScreenPreview() {
    MaterialTheme {
        CalculatorScreen()
    }
}