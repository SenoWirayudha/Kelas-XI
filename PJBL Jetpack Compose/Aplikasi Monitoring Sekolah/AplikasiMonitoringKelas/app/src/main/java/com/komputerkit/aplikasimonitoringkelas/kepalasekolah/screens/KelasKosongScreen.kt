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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.aplikasimonitoringkelas.api.ApiClient
import com.komputerkit.aplikasimonitoringkelas.api.TokenManager
import com.komputerkit.aplikasimonitoringkelas.api.models.GuruMengajarByHariKelasRequest
import com.komputerkit.aplikasimonitoringkelas.api.models.GuruMengajarData
import com.komputerkit.aplikasimonitoringkelas.api.models.KelasData
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KelasKosongScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
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
    var kelasKosongList by remember { mutableStateOf<List<GuruMengajarData>>(emptyList()) }
    
    // Loading states
    var isLoadingKelas by remember { mutableStateOf(false) }
    var isLoadingKosong by remember { mutableStateOf(false) }
    
    // Hardcoded hari list (Senin - Minggu)
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    
    // Function to load kelas kosong
    fun loadKelasKosong() {
        if (selectedKelas == null) return
        
        scope.launch {
            isLoadingKosong = true
            try {
                android.util.Log.d("KelasKosong", "Loading kelas kosong for kelas=${selectedKelas!!.id}, hari=$selectedHari")
                val token = "Bearer ${tokenManager.getToken()}"
                val request = GuruMengajarByHariKelasRequest(
                    hari = selectedHari,
                    kelasId = selectedKelas!!.id
                )
                val response = apiService.getGuruTidakMasuk(token, request)
                
                if (response.isSuccessful && response.body() != null) {
                    kelasKosongList = response.body()!!.data
                    android.util.Log.d("KelasKosong", "✓ Loaded ${kelasKosongList.size} kelas kosong")
                } else {
                    android.util.Log.e("KelasKosong", "✗ Response failed: ${response.code()}")
                    kelasKosongList = emptyList()
                }
            } catch (e: Exception) {
                android.util.Log.e("KelasKosong", "✗ Error loading kelas kosong: ${e.message}")
                e.printStackTrace()
                kelasKosongList = emptyList()
            } finally {
                isLoadingKosong = false
            }
        }
    }
    
    // Function to load kelas from API
    fun loadKelas() {
        scope.launch {
            isLoadingKelas = true
            try {
                android.util.Log.d("KelasKosong", "Loading kelas...")
                val response = apiService.getKelas()
                kelasList = response.data
                android.util.Log.d("KelasKosong", "✓ Loaded ${kelasList.size} kelas")
                
                // Auto-select first kelas
                if (kelasList.isNotEmpty() && selectedKelas == null) {
                    selectedKelas = kelasList[0]
                    loadKelasKosong()
                }
            } catch (e: Exception) {
                android.util.Log.e("KelasKosong", "✗ Error loading kelas: ${e.message}")
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
    
    // Reload kelas kosong when hari or kelas changes
    LaunchedEffect(selectedHari, selectedKelas) {
        if (selectedKelas != null) {
            loadKelasKosong()
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Top bar with user info
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Kelas Kosong",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Text(
                            text = name,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Text(
                            text = email,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                    Row {
                        IconButton(onClick = { 
                            loadKelas()
                            if (selectedKelas != null) loadKelasKosong()
                        }) {
                            Icon(
                                Icons.Default.Refresh,
                                contentDescription = "Refresh",
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                        OutlinedButton(
                            onClick = onLogout,
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.onErrorContainer
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.ExitToApp,
                                contentDescription = "Logout"
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Logout")
                        }
                    }
                }
            }
        }
        
        // Counter card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "${kelasKosongList.size}",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Text(
                        text = "Kelas Kosong",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }
        
        // Spinner Hari
        item {
            ExposedDropdownMenuBox(
                expanded = expandedHari,
                onExpandedChange = { expandedHari = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
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
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
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
        
        // Loading indicator
        if (isLoadingKosong) {
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
        if (!isLoadingKosong && kelasKosongList.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
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
                            text = "Tidak ada kelas kosong untuk hari ini",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        
        // Kelas kosong list
        items(kelasKosongList) { kelas ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${kelas.namaGuru} - ${kelas.mapel}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer
                            )
                        ) {
                            Text(
                                text = kelas.status,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Jam ke ${kelas.jamKe}",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (!kelas.keterangan.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = kelas.keterangan,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }
}
