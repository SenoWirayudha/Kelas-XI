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
    
    // State variables for spinners
    var selectedHari by remember { mutableStateOf("") }
    var selectedKelas by remember { mutableStateOf<KelasData?>(null) }
    var selectedGuru by remember { mutableStateOf<GuruData?>(null) }
    var selectedMapel by remember { mutableStateOf<MapelData?>(null) }
    var selectedStatus by remember { mutableStateOf("") }
    var jamKe by remember { mutableStateOf("") }
    var jadwalId by remember { mutableStateOf<Int?>(null) }
    var keterangan by remember { mutableStateOf("") }
    
    // Expanded states for dropdowns
    var expandedHari by remember { mutableStateOf(false) }
    var expandedKelas by remember { mutableStateOf(false) }
    var expandedGuru by remember { mutableStateOf(false) }
    var expandedMapel by remember { mutableStateOf(false) }
    var expandedStatus by remember { mutableStateOf(false) }
    
    // Data lists for spinners
    var kelasList by remember { mutableStateOf<List<KelasData>>(emptyList()) }
    var guruList by remember { mutableStateOf<List<GuruData>>(emptyList()) }
    var mapelList by remember { mutableStateOf<List<MapelData>>(emptyList()) }
    
    // Loading states
    var isLoadingKelas by remember { mutableStateOf(false) }
    var isLoadingGuru by remember { mutableStateOf(false) }
    var isLoadingMapel by remember { mutableStateOf(false) }
    var isLoadingJadwal by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    val statusList = listOf("Masuk", "Tidak Masuk")
    
    // Function to load kelas based on selected hari
    fun loadKelas(hari: String) {
        scope.launch {
            isLoadingKelas = true
            val token = "Bearer ${tokenManager.getToken()}"
            when (val result = ApiHelper.safeApiCall { apiService.getKelasByHari(token, hari) }) {
                is ApiResult.Success -> {
                    kelasList = result.data.data
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Error: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                ApiResult.Loading -> {}
            }
            isLoadingKelas = false
        }
    }
    
    // Function to load guru based on hari and kelas
    fun loadGuru(hari: String, kelasId: Int) {
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
    fun loadMapel(hari: String, kelasId: Int, guruId: Int) {
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
    fun loadJadwalDetails(hari: String, kelasId: Int, guruId: Int, mapelId: Int) {
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
                status = if (selectedStatus == "Masuk") "masuk" else "tidak_masuk",
                keterangan = keterangan.ifEmpty { null }
            )
            
            when (val result = ApiHelper.safeApiCall { 
                apiService.createGuruMengajar(token, request) 
            }) {
                is ApiResult.Success -> {
                    Toast.makeText(context, "Data berhasil disimpan!", Toast.LENGTH_SHORT).show()
                    // Reset form
                    selectedHari = ""
                    selectedKelas = null
                    selectedGuru = null
                    selectedMapel = null
                    selectedStatus = ""
                    jamKe = ""
                    jadwalId = null
                    keterangan = ""
                    kelasList = emptyList()
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
                    Text("Entri Guru Mengajar", fontWeight = FontWeight.Bold)
                    Text("$name - $email", fontSize = 12.sp)
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
                        text = "Form Penggantian Guru",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    Text(
                        text = "Pilih filter secara berurutan dari Hari sampai Status",
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
                                        selectedKelas = null
                                        selectedGuru = null
                                        selectedMapel = null
                                        selectedStatus = ""
                                        jamKe = ""
                                        jadwalId = null
                                        guruList = emptyList()
                                        mapelList = emptyList()
                                        // Load kelas
                                        loadKelas(hari)
                                    }
                                )
                            }
                        }
                    }

                    // 2. Spinner Kelas
                    ExposedDropdownMenuBox(
                        expanded = expandedKelas,
                        onExpandedChange = { if (kelasList.isNotEmpty()) expandedKelas = it },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedKelas?.nama_kelas ?: "",
                            onValueChange = {},
                            readOnly = true,
                            enabled = kelasList.isNotEmpty(),
                            label = { Text("2. Pilih Kelas") },
                            trailingIcon = {
                                if (isLoadingKelas) {
                                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                } else {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKelas)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                        )

                        ExposedDropdownMenu(
                            expanded = expandedKelas,
                            onDismissRequest = { expandedKelas = false }
                        ) {
                            kelasList.forEach { kelas ->
                                DropdownMenuItem(
                                    text = { Text("${kelas.nama_kelas} (ID: ${kelas.id})") },
                                    onClick = {
                                        selectedKelas = kelas
                                        expandedKelas = false
                                        // Reset cascade
                                        selectedGuru = null
                                        selectedMapel = null
                                        selectedStatus = ""
                                        jamKe = ""
                                        jadwalId = null
                                        mapelList = emptyList()
                                        // Load guru
                                        loadGuru(selectedHari, kelas.id)
                                    }
                                )
                            }
                        }
                    }

                    // 3. Spinner Guru
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
                            label = { Text("3. Pilih Guru") },
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
                                        // Load mapel
                                        loadMapel(selectedHari, selectedKelas!!.id, guru.id)
                                    }
                                )
                            }
                        }
                    }

                    // 4. Spinner Mapel
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
                            label = { Text("4. Pilih Mata Pelajaran") },
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
                                            selectedKelas!!.id,
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

                    // 6. Spinner Status
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
                            label = { Text("5. Pilih Status") },
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

                    // 7. Keterangan (Optional)
                    OutlinedTextField(
                        value = keterangan,
                        onValueChange = { keterangan = it },
                        label = { Text("Keterangan (Opsional)") },
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
