package com.komputerkit.aplikasimonitoringkelas.siswa.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
fun EntriScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }
    val apiService = remember { ApiClient.getApiService() }
    
    // Get kelas_id dari SharedPreferences (untuk siswa)
    val kelasId = remember { tokenManager.getKelasId() }
    
    // State variables for spinners
    var selectedHari by remember { mutableStateOf("") }
    var selectedGuru by remember { mutableStateOf<GuruData?>(null) }
    var selectedMapel by remember { mutableStateOf<MapelData?>(null) }
    var selectedStatus by remember { mutableStateOf("") }
    var jamKe by remember { mutableStateOf("") }
    var jadwalId by remember { mutableStateOf<Int?>(null) }
    var keterangan by remember { mutableStateOf("") }
    
    var kelasName by remember { mutableStateOf("") }
    
    // Expanded states for dropdowns
    var expandedHari by remember { mutableStateOf(false) }
    var expandedGuru by remember { mutableStateOf(false) }
    var expandedMapel by remember { mutableStateOf(false) }
    var expandedStatus by remember { mutableStateOf(false) }
    
    // Data lists for spinners
    var guruList by remember { mutableStateOf<List<GuruData>>(emptyList()) }
    var mapelList by remember { mutableStateOf<List<MapelData>>(emptyList()) }
    
    // Loading states
    var isLoadingGuru by remember { mutableStateOf(false) }
    var isLoadingMapel by remember { mutableStateOf(false) }
    var isLoadingJadwal by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat")
    val statusList = listOf("Masuk", "Tidak Masuk", "Izin")
    
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
    
    // Function to load guru based on hari and kelas (auto using kelasId from token)
    fun loadGuru(hari: String) {
        if (kelasId == null) {
            Toast.makeText(context, "Kelas ID tidak ditemukan", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isLoadingGuru = true
            val token = "Bearer ${tokenManager.getToken()}"
            when (val result = ApiHelper.safeApiCall { 
                apiService.getGuruByHariAndKelas(token, hari, kelasId) 
            }) {
                is ApiResult.Success -> {
                    guruList = result.data.data
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Error: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                ApiResult.Loading -> {}
            }
            isLoadingGuru = false
        }
    }
    
    // Function to load mapel based on hari, kelas, and guru
    fun loadMapel(hari: String, guruId: Int) {
        if (kelasId == null) return
        
        scope.launch {
            isLoadingMapel = true
            val token = "Bearer ${tokenManager.getToken()}"
            when (val result = ApiHelper.safeApiCall { 
                apiService.getMapelByHariKelasGuru(token, hari, kelasId, guruId) 
            }) {
                is ApiResult.Success -> {
                    mapelList = result.data.data
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Error: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                ApiResult.Loading -> {}
            }
            isLoadingMapel = false
        }
    }
    
    // Function to load jadwal details and auto-fill jam_ke
    fun loadJadwalDetails(hari: String, guruId: Int, mapelId: Int) {
        if (kelasId == null) return
        
        scope.launch {
            isLoadingJadwal = true
            val token = "Bearer ${tokenManager.getToken()}"
            when (val result = ApiHelper.safeApiCall { 
                apiService.getJadwalDetails(token, hari, kelasId, guruId, mapelId) 
            }) {
                is ApiResult.Success -> {
                    val detail = result.data.data
                    jamKe = detail.jamKe
                    jadwalId = detail.jadwalId
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Error: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                ApiResult.Loading -> {}
            }
            isLoadingJadwal = false
        }
    }
    
    // Function to save guru mengajar
    fun saveGuruMengajar() {
        if (jadwalId == null || selectedStatus.isEmpty()) {
            Toast.makeText(context, "Lengkapi semua data terlebih dahulu", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isSaving = true
            val token = "Bearer ${tokenManager.getToken()}"
            val request = CreateGuruMengajarRequest(
                jadwalId = jadwalId!!,
                status = when (selectedStatus) {
                    "Masuk" -> "masuk"
                    "Tidak Masuk" -> "tidak_masuk"
                    "Izin" -> "izin"
                    else -> "masuk"
                },
                keterangan = keterangan.ifEmpty { null }
            )
            
            when (val result = ApiHelper.safeApiCall { 
                apiService.createGuruMengajar(token, request) 
            }) {
                is ApiResult.Success -> {
                    Toast.makeText(context, "Data berhasil disimpan!", Toast.LENGTH_SHORT).show()
                    // Reset form
                    selectedHari = ""
                    selectedGuru = null
                    selectedMapel = null
                    selectedStatus = ""
                    jamKe = ""
                    jadwalId = null
                    keterangan = ""
                    guruList = emptyList()
                    mapelList = emptyList()
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Error: ${result.message}", Toast.LENGTH_LONG).show()
                }
                ApiResult.Loading -> {}
            }
            isSaving = false
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Top App Bar
        TopAppBar(
            title = { 
                Column {
                    Text(
                        text = "Entri Guru Mengajar",
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (kelasName.isNotEmpty()) "$name - $kelasName" else "$name - $email",
                        fontSize = 12.sp
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            ),
            actions = {
                OutlinedButton(
                    onClick = onLogout,
                    modifier = Modifier.padding(horizontal = 8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                ) {
                    Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Logout")
                }
            }
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Form Guru Mengajar",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    Text(
                        text = "Pilih filter secara berurutan dari Hari sampai Status untuk kelas Anda",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))

                    // 1. Spinner Hari
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
                                        expandedHari = false
                                        // Reset cascade
                                        selectedGuru = null
                                        selectedMapel = null
                                        selectedStatus = ""
                                        jamKe = ""
                                        jadwalId = null
                                        guruList = emptyList()
                                        mapelList = emptyList()
                                        // Load guru langsung berdasarkan hari dan kelas_id dari token
                                        loadGuru(hari)
                                    }
                                )
                            }
                        }
                    }

                    // 2. Spinner Guru (langsung setelah hari, tidak perlu pilih kelas)
                    ExposedDropdownMenuBox(
                        expanded = expandedGuru,
                        onExpandedChange = { if (guruList.isNotEmpty()) expandedGuru = it },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedGuru?.namaGuru ?: "",
                            onValueChange = {},
                            readOnly = true,
                            enabled = guruList.isNotEmpty(),
                            label = { Text("2. Pilih Guru") },
                            trailingIcon = {
                                if (isLoadingGuru) {
                                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                } else {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedGuru)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                        )

                        ExposedDropdownMenu(
                            expanded = expandedGuru,
                            onDismissRequest = { expandedGuru = false }
                        ) {
                            guruList.forEach { guru ->
                                DropdownMenuItem(
                                    text = { Text("${guru.namaGuru} (${guru.kodeGuru})") },
                                    onClick = {
                                        selectedGuru = guru
                                        expandedGuru = false
                                        // Reset cascade
                                        selectedMapel = null
                                        selectedStatus = ""
                                        jamKe = ""
                                        jadwalId = null
                                        // Load mapel (tidak perlu kelas.id karena sudah ada di parameter function)
                                        loadMapel(selectedHari, guru.id)
                                    }
                                )
                            }
                        }
                    }

                    // 3. Spinner Mapel
                    ExposedDropdownMenuBox(
                        expanded = expandedMapel,
                        onExpandedChange = { if (mapelList.isNotEmpty()) expandedMapel = it },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedMapel?.namaMapel ?: "",
                            onValueChange = {},
                            readOnly = true,
                            enabled = mapelList.isNotEmpty(),
                            label = { Text("3. Pilih Mata Pelajaran") },
                            trailingIcon = {
                                if (isLoadingMapel) {
                                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                } else {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedMapel)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                        )

                        ExposedDropdownMenu(
                            expanded = expandedMapel,
                            onDismissRequest = { expandedMapel = false }
                        ) {
                            mapelList.forEach { mapel ->
                                DropdownMenuItem(
                                    text = { Text("${mapel.namaMapel} (${mapel.kodeMapel})") },
                                    onClick = {
                                        selectedMapel = mapel
                                        expandedMapel = false
                                        // Load jadwal details to get jam_ke
                                        loadJadwalDetails(
                                            selectedHari,
                                            selectedGuru!!.id,
                                            mapel.id
                                        )
                                    }
                                )
                            }
                        }
                    }

                    // 5. Auto-filled Jam Ke (Read-only)
                    OutlinedTextField(
                        value = jamKe,
                        onValueChange = {},
                        readOnly = true,
                        enabled = false,
                        label = { Text("Jam Ke (Otomatis)") },
                        leadingIcon = {
                            if (isLoadingJadwal) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp))
                            } else {
                                Icon(Icons.Default.DateRange, contentDescription = null)
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLeadingIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )

                    // 4. Spinner Status
                    ExposedDropdownMenuBox(
                        expanded = expandedStatus,
                        onExpandedChange = { if (jamKe.isNotEmpty()) expandedStatus = it },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedStatus,
                            onValueChange = {},
                            readOnly = true,
                            enabled = jamKe.isNotEmpty(),
                            label = { Text("4. Pilih Status") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedStatus)
                            },
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                        )

                        ExposedDropdownMenu(
                            expanded = expandedStatus,
                            onDismissRequest = { expandedStatus = false }
                        ) {
                            statusList.forEach { status ->
                                DropdownMenuItem(
                                    text = { Text(status) },
                                    onClick = {
                                        selectedStatus = status
                                        expandedStatus = false
                                    }
                                )
                            }
                        }
                    }

                    // 5. Keterangan (Optional)
                    OutlinedTextField(
                        value = keterangan,
                        onValueChange = { keterangan = it },
                        label = { Text("5. Keterangan (Opsional)") },
                        placeholder = { Text("Contoh: Guru izin sakit") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )

                    Divider(modifier = Modifier.padding(vertical = 8.dp))

                    // Button Simpan
                    Button(
                        onClick = { saveGuruMengajar() },
                        enabled = jadwalId != null && selectedStatus.isNotEmpty() && !isSaving,
                        modifier = Modifier.fillMaxWidth().height(50.dp)
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Menyimpan...")
                        } else {
                            Icon(Icons.Default.Check, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Simpan Data", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Informasi",
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "• Pilih filter secara berurutan: Hari → Kelas → Guru → Mapel → Status\n" +
                               "• Jam Ke akan terisi otomatis setelah memilih Mapel\n" +
                               "• Keterangan bersifat opsional",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
        }
    }
}
