package com.komputerkit.aplikasimonitoringkelas.admin.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class JadwalData(val id: Int, val kelas: String, val mapel: String, val guru: String, val hari: String, val waktu: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UbahJadwalScreen(role: String, email: String) {
    val jadwalList = listOf(
        JadwalData(1, "X IPA 1", "Matematika", "Pak Budi", "Senin", "08:00-09:30"),
        JadwalData(2, "XI IPA 2", "Fisika", "Bu Ani", "Selasa", "10:00-11:30"),
        JadwalData(3, "XII IPA 1", "Kimia", "Pak Dedi", "Rabu", "13:00-14:30")
    )
    
    var selectedJadwal by remember { mutableStateOf<JadwalData?>(null) }
    
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { 
                Column {
                    Text("Ubah Jadwal", fontWeight = FontWeight.Bold)
                    Text("$role - $email", fontSize = 12.sp)
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer
            )
        )
        
        LazyColumn(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(jadwalList) { jadwal ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(2.dp),
                    onClick = { selectedJadwal = jadwal }
                ) {
                    Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) {
                            Text(jadwal.kelas, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text("${jadwal.mapel} - ${jadwal.guru}", fontSize = 14.sp)
                            Text("${jadwal.hari}, ${jadwal.waktu}", fontSize = 12.sp, 
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        IconButton({ selectedJadwal = jadwal }) {
                            Icon(Icons.Default.Edit, "Edit")
                        }
                    }
                }
            }
        }
    }
    
    selectedJadwal?.let { jadwal ->
        AlertDialog(
            onDismissRequest = { selectedJadwal = null },
            title = { Text("Edit ${jadwal.kelas}") },
            text = { Text("Form edit jadwal akan ditampilkan di sini") },
            confirmButton = {
                Button({ selectedJadwal = null }) { Text("Simpan") }
            },
            dismissButton = {
                OutlinedButton({ selectedJadwal = null }) { Text("Batal") }
            }
        )
    }
}
