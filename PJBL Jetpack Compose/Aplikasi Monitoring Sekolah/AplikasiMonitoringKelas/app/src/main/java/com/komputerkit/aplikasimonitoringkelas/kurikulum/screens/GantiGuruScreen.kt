package com.komputerkit.aplikasimonitoringkelas.kurikulum.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.komputerkit.aplikasimonitoringkelas.api.ApiHelper
import com.komputerkit.aplikasimonitoringkelas.api.ApiResult
import com.komputerkit.aplikasimonitoringkelas.api.ApiClient
import com.komputerkit.aplikasimonitoringkelas.api.TokenManager
import com.komputerkit.aplikasimonitoringkelas.api.models.*
import kotlinx.coroutines.launch

/**
 * GantiGuruScreen - New Flow:
 * 1. User pilih Hari
 * 2. System load kelas kosong (guru tidak masuk/izin) pada hari tersebut
 * 3. User pilih kelas kosong
 * 4. System auto-show: Kelas, Guru, Mapel, Jam Ke, Status (read-only)
 * 5. User pilih guru pengganti
 * 6. User isi keterangan (optional)
 * 7. Save
 */

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GantiGuruScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }
    val apiService = remember { ApiClient.getApiService() }
    
    // State variables
    var selectedHari by remember { mutableStateOf("") }
    var selectedKelasKosong by remember { mutableStateOf<KelasKosongData?>(null) }
    var selectedGuruPengganti by remember { mutableStateOf<GuruData?>(null) }
    var keterangan by remember { mutableStateOf("") }
    
    // Expanded states for dropdowns
    var expandedHari by remember { mutableStateOf(false) }
    var expandedKelasKosong by remember { mutableStateOf(false) }
    var expandedGuruPengganti by remember { mutableStateOf(false) }
    
    // Data lists
    var kelasKosongList by remember { mutableStateOf<List<KelasKosongData>>(emptyList()) }
    var guruPenggantiList by remember { mutableStateOf<List<GuruData>>(emptyList()) }
    
    // Loading states
    var isLoadingKelasKosong by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat")
    
    // Function to load kelas kosong based on hari
    fun loadKelasKosong() {
        if (selectedHari.isEmpty()) {
            Toast.makeText(context, "Pilih hari terlebih dahulu", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isLoadingKelasKosong = true
            val token = "Bearer ${tokenManager.getToken()}"
            val request = KelasKosongRequest(hari = selectedHari)
            
            when (val result = ApiHelper.safeApiCall<KelasKosongListResponse> { 
                apiService.getKelasKosongByHari(token, request) 
            }) {
                is ApiResult.Success -> {
                    kelasKosongList = result.data.data
                    if (kelasKosongList.isEmpty()) {
                        Toast.makeText(context, "Tidak ada kelas kosong pada hari $selectedHari", Toast.LENGTH_SHORT).show()
                    }
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Error: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                is ApiResult.Loading -> {}
            }
            isLoadingKelasKosong = false
        }
    }
    
    // Function to load all guru for pengganti
    fun loadAllGuru() {
        scope.launch {
            try {
                val token = "Bearer ${tokenManager.getToken()}"
                val response = apiService.getAllGurus(token)
                // Filter out the guru yang sedang tidak masuk/izin
                if (response.isSuccessful && response.body() != null) {
                    guruPenggantiList = response.body()!!.data.filter { 
                        it.id != selectedKelasKosong?.guruId 
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error loading guru: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    // Function to save guru pengganti
    fun saveGuruPengganti() {
        if (selectedKelasKosong == null || selectedGuruPengganti == null) {
            Toast.makeText(context, "Lengkapi semua data terlebih dahulu", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isSaving = true
            val token = "Bearer ${tokenManager.getToken()}"
            
            // Update guru mengajar dengan guru pengganti
            val request = UpdateGuruMengajarRequest(
                guruPenggantiId = selectedGuruPengganti!!.id,
                status = selectedKelasKosong!!.status,
                statusGuruPengganti = null,
                keterangan = keterangan.ifEmpty { null }
            )
            
            when (val result = ApiHelper.safeApiCall<GuruMengajarResponse> {
                apiService.updateGuruMengajar(token, selectedKelasKosong!!.id, request)
            }) {
                is ApiResult.Success -> {
                    Toast.makeText(context, "Guru pengganti berhasil disimpan!", Toast.LENGTH_SHORT).show()
                    // Reset form
                    selectedHari = ""
                    selectedKelasKosong = null
                    selectedGuruPengganti = null
                    keterangan = ""
                    kelasKosongList = emptyList()
                    guruPenggantiList = emptyList()
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Error: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                is ApiResult.Loading -> {}
            }
            isSaving = false
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ganti Guru") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ),
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "Logout",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Form Penggantian Guru",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Pilih kelas kosong dan assign guru pengganti",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Form Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // 1. Dropdown Hari
                    ExposedDropdownMenuBox(
                        expanded = expandedHari,
                        onExpandedChange = { expandedHari = it },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedHari,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("1. Pilih Hari") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedHari)
                            },
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
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
                                        selectedKelasKosong = null
                                        selectedGuruPengganti = null
                                        kelasKosongList = emptyList()
                                        guruPenggantiList = emptyList()
                                        expandedHari = false
                                        loadKelasKosong()
                                    }
                                )
                            }
                        }
                    }
                    
                    // 2. Dropdown Kelas Kosong
                    ExposedDropdownMenuBox(
                        expanded = expandedKelasKosong,
                        onExpandedChange = { 
                            if (selectedHari.isNotEmpty()) expandedKelasKosong = it 
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedKelasKosong?.let { 
                                "${it.kelasNama} - ${it.guruNama} (${it.mapelNama})" 
                            } ?: "",
                            onValueChange = {},
                            readOnly = true,
                            enabled = selectedHari.isNotEmpty() && kelasKosongList.isNotEmpty(),
                            label = { Text("2. Pilih Kelas Kosong") },
                            placeholder = { Text(
                                when {
                                    selectedHari.isEmpty() -> "Pilih hari terlebih dahulu"
                                    isLoadingKelasKosong -> "Loading..."
                                    kelasKosongList.isEmpty() -> "Tidak ada kelas kosong"
                                    else -> "Pilih kelas"
                                }
                            ) },
                            leadingIcon = {
                                if (isLoadingKelasKosong) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp))
                                } else {
                                    Icon(Icons.Default.DateRange, contentDescription = null)
                                }
                            },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKelasKosong)
                            },
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                        )
                        
                        ExposedDropdownMenu(
                            expanded = expandedKelasKosong,
                            onDismissRequest = { expandedKelasKosong = false }
                        ) {
                            kelasKosongList.forEach { kelas ->
                                DropdownMenuItem(
                                    text = { 
                                        Column {
                                            Text(
                                                text = kelas.kelasNama,
                                                style = MaterialTheme.typography.bodyLarge
                                            )
                                            Text(
                                                text = "${kelas.guruNama} - ${kelas.mapelNama} (Jam ${kelas.jamKe})",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            Text(
                                                text = "Status: ${kelas.status.uppercase()}",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = if (kelas.status == "izin") 
                                                    MaterialTheme.colorScheme.tertiary 
                                                else 
                                                    MaterialTheme.colorScheme.error
                                            )
                                        }
                                    },
                                    onClick = {
                                        selectedKelasKosong = kelas
                                        selectedGuruPengganti = null
                                        expandedKelasKosong = false
                                        loadAllGuru()
                                    }
                                )
                            }
                        }
                    }
                    
                    // Auto-filled fields (Read-only) - Only show when kelas kosong selected
                    if (selectedKelasKosong != null) {
                        Divider(modifier = Modifier.padding(vertical = 8.dp))
                        
                        Text(
                            text = "Detail Kelas Kosong",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        
                        // Kelas
                        OutlinedTextField(
                            value = selectedKelasKosong!!.kelasNama,
                            onValueChange = {},
                            readOnly = true,
                            enabled = false,
                            label = { Text("Kelas") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                        
                        // Guru (yang tidak masuk/izin)
                        OutlinedTextField(
                            value = selectedKelasKosong!!.guruNama,
                            onValueChange = {},
                            readOnly = true,
                            enabled = false,
                            label = { Text("Guru (Tidak Masuk/Izin)") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                        
                        // Mata Pelajaran
                        OutlinedTextField(
                            value = selectedKelasKosong!!.mapelNama,
                            onValueChange = {},
                            readOnly = true,
                            enabled = false,
                            label = { Text("Mata Pelajaran") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                        
                        // Jam Ke
                        OutlinedTextField(
                            value = "Jam Ke ${selectedKelasKosong!!.jamKe}",
                            onValueChange = {},
                            readOnly = true,
                            enabled = false,
                            label = { Text("Waktu") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                        
                        // Status
                        OutlinedTextField(
                            value = selectedKelasKosong!!.status.uppercase(),
                            onValueChange = {},
                            readOnly = true,
                            enabled = false,
                            label = { Text("Status") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = if (selectedKelasKosong!!.status == "izin") 
                                    MaterialTheme.colorScheme.tertiary 
                                else 
                                    MaterialTheme.colorScheme.error,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                        
                        Divider(modifier = Modifier.padding(vertical = 8.dp))
                        
                        // 3. Dropdown Guru Pengganti
                        ExposedDropdownMenuBox(
                            expanded = expandedGuruPengganti,
                            onExpandedChange = { expandedGuruPengganti = it },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedTextField(
                                value = selectedGuruPengganti?.namaGuru ?: "",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("3. Pilih Guru Pengganti") },
                                placeholder = { Text("Pilih guru pengganti") },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedGuruPengganti)
                                },
                                modifier = Modifier.fillMaxWidth().menuAnchor(),
                                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                            )
                            
                            ExposedDropdownMenu(
                                expanded = expandedGuruPengganti,
                                onDismissRequest = { expandedGuruPengganti = false }
                            ) {
                                guruPenggantiList.forEach { guru ->
                                    DropdownMenuItem(
                                        text = { Text(guru.namaGuru) },
                                        onClick = {
                                            selectedGuruPengganti = guru
                                            expandedGuruPengganti = false
                                        }
                                    )
                                }
                            }
                        }
                        
                        // 4. Keterangan (Optional)
                        OutlinedTextField(
                            value = keterangan,
                            onValueChange = { keterangan = it },
                            label = { Text("4. Keterangan (Opsional)") },
                            placeholder = { Text("Contoh: Guru sakit") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3
                        )
                    }
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    
                    // Button Simpan
                    Button(
                        onClick = { saveGuruPengganti() },
                        enabled = selectedKelasKosong != null && 
                                  selectedGuruPengganti != null && 
                                  !isSaving,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(if (isSaving) "Menyimpan..." else "Simpan Guru Pengganti")
                    }
                }
            }
        }
    }
}
