package com.komputerkit.aplikasimonitoringkelas.kepalasekolah.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.aplikasimonitoringkelas.api.ApiClient
import com.komputerkit.aplikasimonitoringkelas.api.TokenManager
import com.komputerkit.aplikasimonitoringkelas.api.models.KelasData
import com.komputerkit.aplikasimonitoringkelas.api.models.JadwalData
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JadwalPelajaranKepsekScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = TokenManager(context)
    val apiService = ApiClient.getApiService()
    
    // States untuk spinner
    var selectedHari by remember { mutableStateOf("Senin") }
    var selectedKelas by remember { mutableStateOf<KelasData?>(null) }
    var expandedHari by remember { mutableStateOf(false) }
    var expandedKelas by remember { mutableStateOf(false) }
    
    // Data lists
    var kelasList by remember { mutableStateOf<List<KelasData>>(emptyList()) }
    var jadwalList by remember { mutableStateOf<List<JadwalData>>(emptyList()) }
    
    // Loading states
    var isLoadingKelas by remember { mutableStateOf(false) }
    var isLoadingJadwal by remember { mutableStateOf(false) }
    
    // Hardcoded hari list (Senin - Minggu)
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    
    // Function to load jadwal by kelas and hari
    fun loadJadwal() {
        if (selectedKelas == null) return
        
        scope.launch {
            isLoadingJadwal = true
            try {
                android.util.Log.d("JadwalKepsek", "Loading jadwal for kelas=${selectedKelas!!.id}, hari=$selectedHari")
                val token = "Bearer ${tokenManager.getToken()}"
                val response = apiService.getJadwalByKelasAndHari(
                    token = token,
                    kelasId = selectedKelas!!.id,
                    hari = selectedHari
                )
                
                if (response.isSuccessful && response.body() != null) {
                    jadwalList = response.body()!!.data
                    android.util.Log.d("JadwalKepsek", "✓ Loaded ${jadwalList.size} jadwal")
                } else {
                    android.util.Log.e("JadwalKepsek", "✗ Response failed: ${response.code()}")
                    jadwalList = emptyList()
                }
            } catch (e: Exception) {
                android.util.Log.e("JadwalKepsek", "✗ Error loading jadwal: ${e.message}")
                e.printStackTrace()
                jadwalList = emptyList()
            } finally {
                isLoadingJadwal = false
            }
        }
    }
    
    // Function to load kelas from API
    fun loadKelas() {
        scope.launch {
            isLoadingKelas = true
            try {
                android.util.Log.d("JadwalKepsek", "Loading kelas...")
                val response = apiService.getKelas()
                kelasList = response.data
                android.util.Log.d("JadwalKepsek", "✓ Loaded ${kelasList.size} kelas")
                
                // Auto-select first kelas
                if (kelasList.isNotEmpty() && selectedKelas == null) {
                    selectedKelas = kelasList[0]
                    loadJadwal()
                }
            } catch (e: Exception) {
                android.util.Log.e("JadwalKepsek", "✗ Error loading kelas: ${e.message}")
                e.printStackTrace()
            } finally {
                isLoadingKelas = false
            }
        }
    }
    
    // Auto-load kelas on screen open
    LaunchedEffect(Unit) {
        loadKelas()
    }
    
    // Reload jadwal when hari or kelas changes
    LaunchedEffect(selectedHari, selectedKelas) {
        if (selectedKelas != null) {
            loadJadwal()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Informasi User Login dengan Logout Button
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "Selamat Datang",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = name,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = email,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    
                    OutlinedButton(
                        onClick = onLogout,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Logout"
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Logout")
                    }
                }
            }
        }

        // Spinner Hari
        item {
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
        }

        // Spinner Kelas
        item {
            ExposedDropdownMenuBox(
                expanded = expandedKelas,
                onExpandedChange = { expandedKelas = it },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = selectedKelas?.nama_kelas ?: if (isLoadingKelas) "Loading..." else "Pilih Kelas",
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
                    if (isLoadingKelas) {
                        DropdownMenuItem(
                            text = { Text("Loading...") },
                            onClick = {}
                        )
                    } else {
                        kelasList.forEach { kelas ->
                            DropdownMenuItem(
                                text = { Text(kelas.nama_kelas) },
                                onClick = {
                                    selectedKelas = kelas
                                    expandedKelas = false
                                }
                            )
                        }
                    }
                }
            }
        }

        // Header info
        item {
            Text(
                text = "Jadwal ${selectedKelas?.nama_kelas ?: "-"} - $selectedHari",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        // Loading indicator
        if (isLoadingJadwal) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }

        // Empty state
        if (!isLoadingJadwal && jadwalList.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Tidak ada jadwal untuk hari ini",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Daftar jadwal
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
                        text = "Jam ke ${jadwal.jam_ke}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Mata Pelajaran
                    Text(
                        text = jadwal.mapel?.nama_mapel ?: "-",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Kode Guru dan Nama Guru
                    Text(
                        text = "${jadwal.guru?.kode_guru ?: "-"} - ${jadwal.guru?.nama_guru ?: "-"}",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
