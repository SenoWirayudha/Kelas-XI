package com.komputerkit.cgpaapp.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.cgpaapp.model.SemesterData

/**
 * Fungsi helper untuk menghitung Grade Point
 * Mengkonversi grade huruf ke poin dan mengalikan dengan kredit
 */
fun calculateGradePoint(grade: String, credit: Int): Double {
    val gradeValue = when (grade.uppercase().trim()) {
        "A+", "A PLUS" -> 4.0  // Beberapa kampus menggunakan A+ = 4.0
        "A" -> 4.0
        "A-", "A MINUS" -> 3.7
        "B+", "B PLUS" -> 3.3
        "B" -> 3.0
        "B-", "B MINUS" -> 2.7
        "C+", "C PLUS" -> 2.3
        "C" -> 2.0
        "C-", "C MINUS" -> 1.7
        "D+", "D PLUS" -> 1.3
        "D" -> 1.0
        "D-", "D MINUS" -> 0.7
        "E" -> 0.5
        "F" -> 0.0
        else -> 0.0
    }
    return gradeValue * credit
}

/**
 * Composable utama untuk Calculator CGPA
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CgpaCalculatorScreen() {
    // State untuk 4 subjek/mata kuliah
    var grade1 by remember { mutableStateOf("") }
    var credit1 by remember { mutableStateOf("") }
    
    var grade2 by remember { mutableStateOf("") }
    var credit2 by remember { mutableStateOf("") }
    
    var grade3 by remember { mutableStateOf("") }
    var credit3 by remember { mutableStateOf("") }
    
    var grade4 by remember { mutableStateOf("") }
    var credit4 by remember { mutableStateOf("") }
    
    // State untuk menyimpan hasil perhitungan
    val semesterDataList = remember { mutableStateListOf<SemesterData>() }
    var overallCgpa by remember { mutableStateOf(0.0) }
    var showError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    
    // Scroll state untuk scrolling
    val scrollState = rememberScrollState()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header/Judul
        Text(
            text = "Kalkulator CGPA",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 24.dp, top = 16.dp)
        )
        
        // Card untuk input data
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Input Data Mata Kuliah",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                // Subjek 1
                SubjectInputRow(
                    subjectNumber = 1,
                    grade = grade1,
                    credit = credit1,
                    onGradeChange = { grade1 = it },
                    onCreditChange = { credit1 = it }
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Subjek 2
                SubjectInputRow(
                    subjectNumber = 2,
                    grade = grade2,
                    credit = credit2,
                    onGradeChange = { grade2 = it },
                    onCreditChange = { credit2 = it }
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Subjek 3
                SubjectInputRow(
                    subjectNumber = 3,
                    grade = grade3,
                    credit = credit3,
                    onGradeChange = { grade3 = it },
                    onCreditChange = { credit3 = it }
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Subjek 4
                SubjectInputRow(
                    subjectNumber = 4,
                    grade = grade4,
                    credit = credit4,
                    onGradeChange = { grade4 = it },
                    onCreditChange = { credit4 = it }
                )
            }
        }
        
        // Tombol Hitung CGPA
        Button(
            onClick = {
                try {
                    // Clear previous data
                    semesterDataList.clear()
                    showError = false
                    
                    // Validasi dan hitung untuk setiap subjek
                    val subjects = listOf(
                        Triple(grade1, credit1, 1),
                        Triple(grade2, credit2, 2),
                        Triple(grade3, credit3, 3),
                        Triple(grade4, credit4, 4)
                    )
                    
                    var totalGradePoints = 0.0
                    var totalCredits = 0
                    
                    subjects.forEach { (grade, credit, num) ->
                        if (grade.isNotEmpty() && credit.isNotEmpty()) {
                            val creditInt = credit.toIntOrNull()
                            if (creditInt == null || creditInt <= 0) {
                                throw IllegalArgumentException("Kredit subjek $num harus berupa angka positif")
                            }
                            
                            val gradePoint = calculateGradePoint(grade, creditInt)
                            semesterDataList.add(SemesterData(grade, creditInt, gradePoint))
                            
                            totalGradePoints += gradePoint
                            totalCredits += creditInt
                        }
                    }
                    
                    if (semesterDataList.isEmpty()) {
                        throw IllegalArgumentException("Masukkan minimal satu mata kuliah")
                    }
                    
                    // Hitung CGPA
                    overallCgpa = if (totalCredits > 0) {
                        totalGradePoints / totalCredits
                    } else {
                        0.0
                    }
                    
                } catch (e: Exception) {
                    showError = true
                    errorMessage = e.message ?: "Terjadi kesalahan"
                    overallCgpa = 0.0
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text(
                text = "Hitung CGPA",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Error Message
        if (showError) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Text(
                    text = errorMessage,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(16.dp),
                    fontWeight = FontWeight.Medium
                )
            }
        }
        
        // Tampilan Hasil CGPA
        if (overallCgpa > 0.0) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "CGPA Keseluruhan",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Text(
                        text = String.format("%.2f", overallCgpa),
                        fontSize = 48.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Predikat berdasarkan CGPA
                    val predikat = when {
                        overallCgpa >= 3.75 -> "Summa Cum Laude"
                        overallCgpa >= 3.5 -> "Magna Cum Laude"
                        overallCgpa >= 3.0 -> "Cum Laude"
                        overallCgpa >= 2.75 -> "Sangat Memuaskan"
                        overallCgpa >= 2.0 -> "Memuaskan"
                        else -> "Cukup"
                    }
                    
                    Text(
                        text = predikat,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            
            // Riwayat/Ringkasan Data
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Ringkasan Mata Kuliah",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    
                    // Header tabel
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "No",
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(0.5f)
                        )
                        Text(
                            text = "Grade",
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "Kredit",
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "Poin",
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.End
                        )
                    }
                    
                    Divider(modifier = Modifier.padding(bottom = 8.dp))
                    
                    // Data rows
                    semesterDataList.forEachIndexed { index, data ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${index + 1}",
                                modifier = Modifier.weight(0.5f)
                            )
                            Text(
                                text = data.grade,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "${data.credit}",
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = String.format("%.2f", data.gradePoint),
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.End
                            )
                        }
                    }
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    
                    // Total
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Total",
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1.5f)
                        )
                        Text(
                            text = "${semesterDataList.sumOf { it.credit }}",
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = String.format("%.2f", semesterDataList.sumOf { it.gradePoint }),
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.End
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}

/**
 * Composable untuk satu baris input subjek
 */
@Composable
fun SubjectInputRow(
    subjectNumber: Int,
    grade: String,
    credit: String,
    onGradeChange: (String) -> Unit,
    onCreditChange: (String) -> Unit
) {
    Column {
        Text(
            text = "Mata Kuliah $subjectNumber",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(bottom = 8.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Input Grade
            OutlinedTextField(
                value = grade,
                onValueChange = onGradeChange,
                label = { Text("Grade (A, B, C, dll)") },
                modifier = Modifier.weight(1.5f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            
            // Input Credit
            OutlinedTextField(
                value = credit,
                onValueChange = onCreditChange,
                label = { Text("Kredit") },
                modifier = Modifier.weight(1f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
        }
    }
}
