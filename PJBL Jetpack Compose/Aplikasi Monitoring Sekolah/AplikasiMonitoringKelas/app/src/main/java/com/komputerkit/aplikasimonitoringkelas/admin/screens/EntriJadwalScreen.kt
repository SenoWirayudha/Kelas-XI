package com.komputerkit.aplikasimonitoringkelas.admin.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.aplikasimonitoringkelas.api.ApiClient
import com.komputerkit.aplikasimonitoringkelas.api.models.KelasData
import com.komputerkit.aplikasimonitoringkelas.api.models.MapelData
import com.komputerkit.aplikasimonitoringkelas.api.models.GuruData
import com.komputerkit.aplikasimonitoringkelas.api.models.CreateJadwalRequest
import kotlinx.coroutines.*

data class JadwalEntry(
    val hari: String,
    val kelas: String,
    val mataPelajaran: String,
    val guru: String,
    val jamKe: String
)

// Temporary storage untuk menyimpan jadwal agar tidak hilang saat navigation
object JadwalTempStorage {
    var jadwalList = mutableListOf<JadwalEntry>()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EntriJadwalScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    // Gunakan rememberCoroutineScope dengan proper lifecycle
    val scope = rememberCoroutineScope()
    
    var selectedHari by remember { mutableStateOf("") }
    var selectedKelas by remember { mutableStateOf<KelasData?>(null) }
    var selectedMapel by remember { mutableStateOf<MapelData?>(null) }
    var selectedGuru by remember { mutableStateOf<GuruData?>(null) }
    var jamKe by remember { mutableStateOf("") }
    
    var expandedHari by remember { mutableStateOf(false) }
    var expandedKelas by remember { mutableStateOf(false) }
    var expandedMapel by remember { mutableStateOf(false) }
    var expandedGuru by remember { mutableStateOf(false) }
    
    // Gunakan JadwalTempStorage agar data tidak hilang saat navigation
    var jadwalList by remember { 
        mutableStateOf(JadwalTempStorage.jadwalList.toList()) 
    }
    
    // Data dari API
    var kelasList by remember { mutableStateOf<List<KelasData>>(emptyList()) }
    var mapelList by remember { mutableStateOf<List<MapelData>>(emptyList()) }
    var guruList by remember { mutableStateOf<List<GuruData>>(emptyList()) }
    
    var isLoadingKelas by remember { mutableStateOf(false) }
    var isLoadingMapel by remember { mutableStateOf(false) }
    var isLoadingGuru by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    
    // Hardcoded hari list
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    
    // Load data functions - SIMPLIFIED (no delays, no dispatchers)
    fun loadKelas() {
        scope.launch {
            isLoadingKelas = true
            try {
                android.util.Log.d("EntriJadwal", "Loading kelas...")
                val kelasResponse = ApiClient.getApiService().getKelas()
                kelasList = kelasResponse.data
                android.util.Log.d("EntriJadwal", "✓ Loaded ${kelasList.size} kelas")
            } catch (e: Exception) {
                android.util.Log.e("EntriJadwal", "✗ Kelas error: ${e.javaClass.simpleName}: ${e.message}")
                e.printStackTrace()
            } finally {
                isLoadingKelas = false
            }
        }
    }
    
    fun loadMapel() {
        scope.launch {
            isLoadingMapel = true
            try {
                android.util.Log.d("EntriJadwal", "Loading mapel...")
                val mapelResponse = ApiClient.getApiService().getMapels()
                mapelList = mapelResponse.data
                android.util.Log.d("EntriJadwal", "✓ Loaded ${mapelList.size} mapel")
            } catch (e: Exception) {
                android.util.Log.e("EntriJadwal", "✗ Mapel error: ${e.javaClass.simpleName}: ${e.message}")
                e.printStackTrace()
            } finally {
                isLoadingMapel = false
            }
        }
    }
    
    fun loadGuru() {
        scope.launch {
            isLoadingGuru = true
            try {
                android.util.Log.d("EntriJadwal", "Loading guru...")
                val guruResponse = ApiClient.getApiService().getGurus()
                guruList = guruResponse.data
                android.util.Log.d("EntriJadwal", "✓ Loaded ${guruList.size} guru")
            } catch (e: Exception) {
                android.util.Log.e("EntriJadwal", "✗ Guru error: ${e.javaClass.simpleName}: ${e.message}")
                e.printStackTrace()
            } finally {
                isLoadingGuru = false
            }
        }
    }
    
    fun loadJadwal() {
        scope.launch {
            try {
                android.util.Log.d("EntriJadwal", "Loading jadwal...")
                val jadwalResponse = ApiClient.getApiService().getJadwals()
                if (jadwalResponse.success) {
                    JadwalTempStorage.jadwalList.clear()
                    jadwalResponse.data.forEach { jadwalData ->
                        JadwalTempStorage.jadwalList.add(
                            JadwalEntry(
                                hari = jadwalData.hari,
                                kelas = jadwalData.kelas?.nama_kelas ?: "",
                                mataPelajaran = jadwalData.mapel?.nama_mapel ?: "",
                                guru = jadwalData.guru?.nama_guru ?: "",
                                jamKe = jadwalData.jam_ke
                            )
                        )
                    }
                    jadwalList = JadwalTempStorage.jadwalList.toList()
                    android.util.Log.d("EntriJadwal", "Loaded ${jadwalList.size} jadwal from database")
                }
            } catch (e: Exception) {
                android.util.Log.e("EntriJadwal", "Error loading jadwal: ${e.message}")
            }
        }
    }
    
    // Auto-load data saat screen pertama kali dibuka
    LaunchedEffect(Unit) {
        android.util.Log.d("EntriJadwal", "Starting auto-load data...")
        loadKelas()
        loadMapel()
        loadGuru()
        loadJadwal()
    }
    
    val isFormValid = selectedHari.isNotBlank() && 
                      selectedKelas != null && 
                      selectedMapel != null && 
                      selectedGuru != null && 
                      jamKe.isNotBlank()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Informasi Admin dengan Logout Button
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
                        text = "Admin Panel",
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

        // Title
        item {
            Text(
                text = "Entri Jadwal Baru",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        // 1. Spinner Hari
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

        // 2. Spinner Kelas
        item {
            ExposedDropdownMenuBox(
            expanded = expandedKelas,
            onExpandedChange = { expandedKelas = it },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedKelas?.nama_kelas ?: "",
                onValueChange = {},
                readOnly = true,
                label = { Text("Pilih Kelas") },
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKelas)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(),
                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                enabled = !isLoadingKelas
            )

            ExposedDropdownMenu(
                expanded = expandedKelas,
                onDismissRequest = { expandedKelas = false }
            ) {
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

        // 3. Spinner Mata Pelajaran
        item {
            ExposedDropdownMenuBox(
                expanded = expandedMapel,
                onExpandedChange = { expandedMapel = it },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = selectedMapel?.namaMapel ?: "",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Pilih Mata Pelajaran") },
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedMapel)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(),
                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                enabled = !isLoadingMapel
            )

            ExposedDropdownMenu(
                expanded = expandedMapel,
                onDismissRequest = { expandedMapel = false }
            ) {
                mapelList.forEach { mapel ->
                    DropdownMenuItem(
                        text = { Text(mapel.namaMapel) },
                        onClick = {
                            selectedMapel = mapel
                            expandedMapel = false
                        }
                    )
                }
            }
        }
        }

        // 4. Spinner Guru
        item {
            ExposedDropdownMenuBox(
            expanded = expandedGuru,
            onExpandedChange = { expandedGuru = it },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedGuru?.namaGuru ?: "",
                onValueChange = {},
                readOnly = true,
                label = { Text("Pilih Guru") },
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedGuru)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(),
                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                enabled = !isLoadingGuru
            )

            ExposedDropdownMenu(
                expanded = expandedGuru,
                onDismissRequest = { expandedGuru = false }
            ) {
                guruList.forEach { guru ->
                    DropdownMenuItem(
                        text = { Text(guru.namaGuru) },
                        onClick = {
                            selectedGuru = guru
                            expandedGuru = false
                        }
                    )
                }
            }
        }
        }

        // 5. TextField Jam Ke
        item {
            OutlinedTextField(
                value = jamKe,
                onValueChange = { jamKe = it },
                label = { Text("Jam Ke") },
                placeholder = { Text("Contoh: 1-3") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        }

        // 6. Button Simpan
        item {
        Button(
            onClick = {
                if (isFormValid && selectedKelas != null && selectedMapel != null && selectedGuru != null) {
                    // Simpan ke API dan local state
                    scope.launch {
                        isSaving = true
                        try {
                            // Simpan ke API (database)
                            val request = CreateJadwalRequest(
                                guru_id = selectedGuru!!.id,
                                mapel_id = selectedMapel!!.id,
                                tahun_ajaran_id = 1, // Hardcode untuk tahun ajaran aktif
                                kelas_id = selectedKelas!!.id,
                                jam_ke = jamKe,
                                hari = selectedHari
                            )
                            
                            // Log request untuk debugging
                            android.util.Log.d("EntriJadwal", "Request: guru_id=${request.guru_id}, mapel_id=${request.mapel_id}, kelas_id=${request.kelas_id}, jam_ke=${request.jam_ke}, hari=${request.hari}")
                            
                            val response = ApiClient.getApiService().createJadwal(request)
                            
                            android.util.Log.d("EntriJadwal", "Response code: ${response.code()}, success: ${response.body()?.success}")
                            
                            if (response.isSuccessful && response.body()?.success == true) {
                                // Simpan juga ke temporary storage untuk tampilan list
                                val newEntry = JadwalEntry(
                                    selectedHari,
                                    selectedKelas!!.nama_kelas,
                                    selectedMapel!!.namaMapel,
                                    selectedGuru!!.namaGuru,
                                    jamKe
                                )
                                JadwalTempStorage.jadwalList.add(newEntry)
                                jadwalList = JadwalTempStorage.jadwalList.toList()
                                
                                android.util.Log.d("EntriJadwal", "Jadwal berhasil disimpan ke database!")
                                
                                // Reset form
                                selectedHari = ""
                                selectedKelas = null
                                selectedMapel = null
                                selectedGuru = null
                                jamKe = ""
                            } else {
                                val errorBody = response.errorBody()?.string()
                                val errorMsg = response.body()?.message ?: errorBody ?: response.message()
                                android.util.Log.e("EntriJadwal", "Error: $errorMsg")
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("EntriJadwal", "Exception: ${e.message}", e)
                        } finally {
                            isSaving = false
                        }
                    }
                }
            },
            enabled = isFormValid && !isSaving,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Menyimpan...")
            } else {
                Icon(Icons.Default.CheckCircle, contentDescription = "Simpan")
                Spacer(modifier = Modifier.width(8.dp))
                Text("Simpan Jadwal")
            }
        }
        }

        // Header List
        item {
            Text(
                text = "Daftar Jadwal Tersimpan (${jadwalList.size})",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        // 7. Daftar jadwal yang sudah di-simpan
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
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${jadwal.hari} - ${jadwal.kelas}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                                )
                            ) {
                                Text(
                                    text = "Jam ke ${jadwal.jamKe}",
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = jadwal.mataPelajaran,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        
                        Spacer(modifier = Modifier.height(4.dp))
                        
                        Text(
                            text = "Guru: ${jadwal.guru}",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
