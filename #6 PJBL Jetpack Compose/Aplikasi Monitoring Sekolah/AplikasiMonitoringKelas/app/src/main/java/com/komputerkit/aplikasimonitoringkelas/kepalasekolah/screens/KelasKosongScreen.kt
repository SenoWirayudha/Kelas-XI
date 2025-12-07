package com.komputerkit.aplikasimonitoringkelas.kepalasekolah.screens

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
import com.komputerkit.aplikasimonitoringkelas.api.ApiClient
import com.komputerkit.aplikasimonitoringkelas.api.TokenManager
import com.komputerkit.aplikasimonitoringkelas.api.models.GuruMengajarByHariKelasRequest
import com.komputerkit.aplikasimonitoringkelas.api.models.GuruMengajarData
import com.komputerkit.aplikasimonitoringkelas.api.models.KelasData
import com.komputerkit.aplikasimonitoringkelas.api.models.KelasKosongData
import com.komputerkit.aplikasimonitoringkelas.api.models.KelasKosongRequest
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
    var expandedHari by remember { mutableStateOf(false) }
    
    // Data lists
    var kelasKosongList by remember { mutableStateOf<List<KelasKosongData>>(emptyList()) }
    
    // Loading states
    var isLoadingKosong by remember { mutableStateOf(false) }
    
    // Hardcoded hari list (Senin - Minggu)
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat")
    
    // Function to load kelas kosong (hanya yang belum ada guru pengganti)
    fun loadKelasKosong() {
        scope.launch {
            isLoadingKosong = true
            try {
                android.util.Log.d("KelasKosong", "Loading kelas kosong for hari=$selectedHari")
                val token = "Bearer ${tokenManager.getToken()}"
                val request = KelasKosongRequest(hari = selectedHari)
                val response = apiService.getKelasKosongByHari(token, request)
                
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
    
    // Auto-load kelas kosong on screen open and when hari changes
    LaunchedEffect(selectedHari) {
        loadKelasKosong()
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
                            loadKelasKosong()
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
                elevation = CardDefaults.cardElevation(2.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    // Header: Kelas
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp),
                                tint = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = kelas.kelasNama,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = when (kelas.status.lowercase()) {
                                    "tidak_masuk" -> MaterialTheme.colorScheme.errorContainer
                                    "izin" -> MaterialTheme.colorScheme.tertiaryContainer
                                    else -> MaterialTheme.colorScheme.secondaryContainer
                                }
                            )
                        ) {
                            Text(
                                text = when (kelas.status.lowercase()) {
                                    "tidak_masuk" -> "Tidak Masuk"
                                    "izin" -> "Izin"
                                    else -> kelas.status
                                },
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = when (kelas.status.lowercase()) {
                                    "tidak_masuk" -> MaterialTheme.colorScheme.onErrorContainer
                                    "izin" -> MaterialTheme.colorScheme.onTertiaryContainer
                                    else -> MaterialTheme.colorScheme.onSecondaryContainer
                                }
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.2f))
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Guru
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Guru:",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.7f)
                            )
                            Text(
                                text = kelas.guruNama,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Mapel & Jam
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "Mata Pelajaran:",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = kelas.mapelNama,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                        }
                        
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Text(
                                text = "Jam ${kelas.jamKe}",
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    
                    // Keterangan
                    if (!kelas.keterangan.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = kelas.keterangan,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                    
                    // Warning: Belum ada guru pengganti
                    Spacer(modifier = Modifier.height(12.dp))
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onError
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "⚠️ Belum ada guru pengganti",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onError
                            )
                        }
                    }
                }
            }
        }
    }
}
