package com.komputerkit.aplikasimonitoringkelas.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class JadwalData(
    val jamKe: String,
    val mataPelajaran: String,
    val kodeGuru: String,
    val namaGuru: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JadwalScreen() {
    var selectedHari by remember { mutableStateOf("Senin") }
    var selectedKelas by remember { mutableStateOf("X RPL") }
    var expandedHari by remember { mutableStateOf(false) }
    var expandedKelas by remember { mutableStateOf(false) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    val kelasList = listOf("X RPL", "XI RPL", "XII RPL")
    
    // Sample data jadwal
    val jadwalList = listOf(
        JadwalData("1-3", "Matematika", "MTK001", "Pak Budi Santoso"),
        JadwalData("4-5", "Bahasa Indonesia", "BIN002", "Bu Ani Wijaya"),
        JadwalData("6-7", "Pemrograman Web", "PWB003", "Pak Dedi Kurniawan"),
        JadwalData("8-9", "Basis Data", "BDT004", "Bu Eka Putri"),
        JadwalData("1-2", "Bahasa Inggris", "ING005", "Bu Fitri Handayani"),
        JadwalData("3-4", "Pemrograman Mobile", "PMB006", "Pak Galih Pratama"),
        JadwalData("5-6", "Desain Grafis", "DGR007", "Bu Hani Safitri"),
        JadwalData("7-8", "Jaringan Komputer", "JKM008", "Pak Irfan Hidayat"),
        JadwalData("9-10", "Sistem Operasi", "SOP009", "Bu Juwita Sari"),
        JadwalData("1-3", "Praktikum RPL", "RPL010", "Pak Kurniawan")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Informasi User Login
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Selamat Datang",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "User Login", // Bisa diganti dengan data user dari intent
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "user@sekolah.com", // Bisa diganti dengan email user
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Spinner Hari
        ExposedDropdownMenuBox(
            expanded = expandedHari,
            onExpandedChange = { expandedHari = it },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedHari,
                onValueChange = {},
                readOnly = true,
                label = { Text("Pilih Hari") },
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedHari)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(),
                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
            )

            ExposedDropdownMenu(
                expanded = expandedHari,
                onDismissRequest = { expandedHari = false }
            ) {
                hariList.forEach { hari ->
                    DropdownMenuItem(
                        text = { Text(hari) },
                        onClick = {
                            selectedHari = hari
                            expandedHari = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Spinner Kelas
        ExposedDropdownMenuBox(
            expanded = expandedKelas,
            onExpandedChange = { expandedKelas = it },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedKelas,
                onValueChange = {},
                readOnly = true,
                label = { Text("Pilih Kelas") },
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKelas)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(),
                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
            )

            ExposedDropdownMenu(
                expanded = expandedKelas,
                onDismissRequest = { expandedKelas = false }
            ) {
                kelasList.forEach { kelas ->
                    DropdownMenuItem(
                        text = { Text(kelas) },
                        onClick = {
                            selectedKelas = kelas
                            expandedKelas = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Header info
        Text(
            text = "Jadwal $selectedKelas - $selectedHari",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // LazyColumn untuk daftar jadwal (scrollable)
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(jadwalList) { jadwal ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        // Jam ke
                        Text(
                            text = "Jam ke ${jadwal.jamKe}",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Mata Pelajaran
                        Text(
                            text = jadwal.mataPelajaran,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Kode Guru dan Nama Guru
                        Text(
                            text = "${jadwal.kodeGuru} - ${jadwal.namaGuru}",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
