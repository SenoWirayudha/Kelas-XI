package com.komputerkit.aplikasimonitoringkelas.siswa.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.aplikasimonitoringkelas.api.*
import com.komputerkit.aplikasimonitoringkelas.api.models.*
import kotlinx.coroutines.launch


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JadwalPelajaranScreen(
    role: String, 
    email: String, 
    name: String,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }
    val apiService = remember { ApiClient.getApiService() }
    
    // Get kelas_id dari SharedPreferences (untuk siswa)
    val kelasId = remember { tokenManager.getKelasId() }
    
    // States
    var selectedHari by remember { mutableStateOf("") }
    var expandedHari by remember { mutableStateOf(false) }
    
    var kelasName by remember { mutableStateOf("") }
    
    var jadwalList by remember { mutableStateOf<List<JadwalData>>(emptyList()) }
    var isLoadingJadwal by remember { mutableStateOf(false) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat")
    
    // Load kelas name on screen open
    LaunchedEffect(kelasId) {
        if (kelasId != null) {
            try {
                val response = apiService.getKelas()
                val kelas = response.data.find { it.id == kelasId }
                kelasName = kelas?.nama_kelas ?: ""
            } catch (e: Exception) {
                Toast.makeText(context, e.message ?: "Error loading kelas", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(context, "Error: Anda belum terdaftar di kelas manapun", Toast.LENGTH_LONG).show()
        }
    }
    
    // Function to load jadwal data (auto menggunakan kelasId dari token)
    fun loadJadwalData() {
        if (selectedHari.isEmpty()) {
            Toast.makeText(context, "Pilih hari terlebih dahulu", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (kelasId == null) {
            Toast.makeText(context, "Kelas ID tidak ditemukan", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isLoadingJadwal = true
            val token = "Bearer ${tokenManager.getToken()}"
            
            when (val result = ApiHelper.safeApiCall { 
                apiService.getJadwalByKelasAndHari(token, kelasId, selectedHari) 
            }) {
                is ApiResult.Success -> {
                    jadwalList = result.data.data
                    if (jadwalList.isEmpty()) {
                        Toast.makeText(context, "Tidak ada jadwal untuk hari ini", Toast.LENGTH_SHORT).show()
                    }
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Gagal load jadwal: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                is ApiResult.Loading -> {}
            }
            isLoadingJadwal = false
        }
    }

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // TopAppBar
        TopAppBar(
            title = { 
                Column {
                    Text(
                        text = "Jadwal Pelajaran",
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (kelasName.isNotEmpty()) "$name - $kelasName" else "$name - $email",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
            ),
            actions = {
                OutlinedButton(
                    onClick = onLogout,
                    modifier = Modifier.padding(horizontal = 8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.ExitToApp,
                        contentDescription = "Logout"
                    )
                    Spacer(modifier = Modifier.padding(4.dp))
                    Text("Logout")
                }
            }
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Filter Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Filter Jadwal",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    
                    // Spinner Hari
                    ExposedDropdownMenuBox(
                        expanded = expandedHari,
                        onExpandedChange = { expandedHari = it }
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
                                .menuAnchor()
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
                                        // Auto load jadwal setelah pilih hari
                                        loadJadwalData()
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Button Load Jadwal (optional, karena sudah auto-load)
                    Button(
                        onClick = { loadJadwalData() },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = selectedHari.isNotEmpty() && kelasId != null && !isLoadingJadwal
                    ) {
                        if (isLoadingJadwal) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Loading...")
                        } else {
                            Icon(Icons.Default.Search, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Lihat Jadwal")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Loading indicator
            if (isLoadingJadwal) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (jadwalList.isEmpty() && selectedHari.isNotEmpty()) {
                // Empty state
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "No Data",
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Tidak ada jadwal",
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "untuk kelas Anda - $selectedHari",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else if (selectedHari.isEmpty()) {
                // Initial state
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = "Select",
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Pilih Hari",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "untuk melihat jadwal pelajaran kelas Anda",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                // Jadwal List
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = "Jadwal Kelas Anda - $selectedHari",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                    }
                    
                    items(jadwalList) { jadwal ->
                        JadwalCard(jadwal = jadwal)
                    }
                }
            }
        }
    }
}

@Composable
fun JadwalCard(jadwal: JadwalData) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header with ID Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Jam ke ${jadwal.jam_ke}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Text(
                        text = "ID: ${jadwal.id}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Mata Pelajaran
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = "Mapel",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Mata Pelajaran",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = jadwal.mapel?.nama_mapel ?: "N/A",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Nama Guru
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Guru",
                    tint = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Guru",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = jadwal.guru?.nama_guru ?: "N/A",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Kelas Info
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Home,
                    contentDescription = "Kelas",
                    tint = MaterialTheme.colorScheme.tertiary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Kelas",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = jadwal.kelas?.nama_kelas ?: "N/A",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}
