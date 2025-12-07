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
    var selectedStatusGuruPengganti by remember { mutableStateOf("") }
    var jamKe by remember { mutableStateOf("") }
    var jadwalId by remember { mutableStateOf<Int?>(null) }
    var keterangan by remember { mutableStateOf("") }
    var keteranganGuruPengganti by remember { mutableStateOf("") }
    
    // State untuk cek data yang sudah ada
    var existingGuruMengajarId by remember { mutableStateOf<Int?>(null) }
    var existingStatus by remember { mutableStateOf<String?>(null) }
    var guruPenggantiName by remember { mutableStateOf<String?>(null) }
    var hasGuruPengganti by remember { mutableStateOf(false) }
    var isFormGuruAsli by remember { mutableStateOf(true) } // true = form guru asli, false = form guru pengganti
    
    // State untuk daftar guru pengganti yang belum ada statusnya
    var guruPenggantiTanpaStatusList by remember { mutableStateOf<List<GuruMengajarData>>(emptyList()) }
    var guruPenggantiWithHari by remember { mutableStateOf<List<Pair<String, GuruMengajarData>>>(emptyList()) }
    var showGuruPenggantiDialog by remember { mutableStateOf(false) }
    var selectedGuruMengajarData by remember { mutableStateOf<GuruMengajarData?>(null) }
    var isLoadingGuruPengganti by remember { mutableStateOf(false) }
    var selectedHariDialog by remember { mutableStateOf("") }
    var expandedHariDialog by remember { mutableStateOf(false) }
    
    var kelasName by remember { mutableStateOf("") }
    
    // Expanded states for dropdowns
    var expandedHari by remember { mutableStateOf(false) }
    var expandedGuru by remember { mutableStateOf(false) }
    var expandedMapel by remember { mutableStateOf(false) }
    var expandedStatus by remember { mutableStateOf(false) }
    var expandedStatusGuruPengganti by remember { mutableStateOf(false) }
    
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
                    
                    // Cek apakah ada data guru mengajar yang sudah ada
                    val guruMengajarRequest = GuruMengajarByHariKelasRequest(hari, kelasId)
                    when (val gmResult = ApiHelper.safeApiCall {
                        apiService.getGuruMengajarByHariKelas(token, guruMengajarRequest)
                    }) {
                        is ApiResult.Success -> {
                            val existingData = gmResult.data.data.find { it.jadwalId == jadwalId }
                            if (existingData != null) {
                                // Data sudah ada
                                existingGuruMengajarId = existingData.id
                                existingStatus = existingData.status
                                hasGuruPengganti = !existingData.guruPengganti.isNullOrEmpty()
                                guruPenggantiName = existingData.guruPengganti
                                
                                // Tentukan form mana yang harus ditampilkan
                                if (hasGuruPengganti) {
                                    // Jika ada guru pengganti, tampilkan form untuk input status guru pengganti
                                    isFormGuruAsli = false
                                    selectedStatus = when(existingStatus?.lowercase()) {
                                        "masuk" -> "Masuk"
                                        "tidak_masuk" -> "Tidak Masuk"
                                        "izin" -> "Izin"
                                        else -> existingStatus ?: ""
                                    }
                                } else {
                                    // Jika belum ada guru pengganti, tampilkan form untuk input status guru asli
                                    isFormGuruAsli = true
                                }
                            } else {
                                // Data belum ada, form untuk input baru (guru asli)
                                existingGuruMengajarId = null
                                existingStatus = null
                                hasGuruPengganti = false
                                guruPenggantiName = null
                                isFormGuruAsli = true
                            }
                        }
                        else -> {
                            existingGuruMengajarId = null
                            existingStatus = null
                            hasGuruPengganti = false
                            guruPenggantiName = null
                            isFormGuruAsli = true
                        }
                    }
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
                    selectedStatusGuruPengganti = ""
                    jamKe = ""
                    jadwalId = null
                    keterangan = ""
                    keteranganGuruPengganti = ""
                    existingGuruMengajarId = null
                    existingStatus = null
                    hasGuruPengganti = false
                    guruPenggantiName = null
                    isFormGuruAsli = true
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
    
    // Function to load guru pengganti yang belum ada statusnya
    fun loadGuruPenggantiTanpaStatus() {
        if (kelasId == null) return
        
        scope.launch {
            isLoadingGuruPengganti = true
            val token = "Bearer ${tokenManager.getToken()}"
            
            // Get all guru mengajar untuk semua hari
            val allData = mutableListOf<Pair<String, GuruMengajarData>>() // Pair of (hari, data)
            hariList.forEach { hari ->
                val request = GuruMengajarByHariKelasRequest(hari, kelasId)
                when (val result = ApiHelper.safeApiCall {
                    apiService.getGuruMengajarByHariKelas(token, request)
                }) {
                    is ApiResult.Success -> {
                        result.data.data.forEach { guruMengajar ->
                            allData.add(Pair(hari, guruMengajar))
                        }
                    }
                    else -> {}
                }
            }
            
            // Filter yang punya guru pengganti tapi belum ada statusnya
            val filteredData = allData.filter { (_, data) ->
                !data.guruPengganti.isNullOrEmpty() && data.statusGuruPengganti.isNullOrEmpty()
            }
            
            // Store both versions
            guruPenggantiWithHari = filteredData
            guruPenggantiTanpaStatusList = filteredData.map { it.second }
            
            isLoadingGuruPengganti = false
            
            if (filteredData.isNotEmpty()) {
                // Reset selectedHariDialog dan selectedGuruMengajarData
                selectedHariDialog = ""
                selectedGuruMengajarData = null
                showGuruPenggantiDialog = true
            } else {
                Toast.makeText(context, "Tidak ada guru pengganti yang perlu diisi statusnya", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    // Function to update status guru pengganti
    fun updateStatusGuruPengganti(guruMengajarId: Int) {
        if (selectedStatusGuruPengganti.isEmpty()) {
            Toast.makeText(context, "Pilih status guru pengganti terlebih dahulu", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isSaving = true
            val token = "Bearer ${tokenManager.getToken()}"
            val request = UpdateGuruMengajarRequest(
                guruPenggantiId = null,
                status = existingStatus ?: "masuk", // Keep existing status
                statusGuruPengganti = when (selectedStatusGuruPengganti) {
                    "Masuk" -> "masuk"
                    "Tidak Masuk" -> "tidak_masuk"
                    "Izin" -> "izin"
                    else -> null
                },
                keterangan = keteranganGuruPengganti.ifEmpty { null }
            )
            
            when (val result = ApiHelper.safeApiCall { 
                apiService.updateGuruMengajar(token, guruMengajarId, request) 
            }) {
                is ApiResult.Success -> {
                    Toast.makeText(context, "Status guru pengganti berhasil disimpan!", Toast.LENGTH_SHORT).show()
                    // Reset form
                    selectedHari = ""
                    selectedGuru = null
                    selectedMapel = null
                    selectedStatus = ""
                    selectedStatusGuruPengganti = ""
                    jamKe = ""
                    jadwalId = null
                    keterangan = ""
                    keteranganGuruPengganti = ""
                    existingGuruMengajarId = null
                    existingStatus = null
                    hasGuruPengganti = false
                    guruPenggantiName = null
                    isFormGuruAsli = true
                    guruList = emptyList()
                    mapelList = emptyList()
                    selectedGuruMengajarData = null
                    showGuruPenggantiDialog = false
                    // Refresh list
                    loadGuruPenggantiTanpaStatus()
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
                    
                    // Tombol untuk langsung ke form guru pengganti
                    Button(
                        onClick = { loadGuruPenggantiTanpaStatus() },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.tertiaryContainer,
                            contentColor = MaterialTheme.colorScheme.onTertiaryContainer
                        ),
                        enabled = !isLoadingGuruPengganti
                    ) {
                        if (isLoadingGuruPengganti) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Memuat...")
                        } else {
                            Icon(Icons.Default.Edit, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Isi Status Guru Pengganti")
                        }
                    }
                    
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

                    // Tampilkan form berdasarkan kondisi
                    if (jamKe.isNotEmpty()) {
                        if (isFormGuruAsli) {
                            // FORM UNTUK GURU ASLI (Data belum ada atau belum ada guru pengganti)
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Form Status Guru Mengajar",
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }
                                    
                                    Spacer(modifier = Modifier.height(12.dp))
                                    
                                    // 4. Spinner Status Guru
                                    ExposedDropdownMenuBox(
                                        expanded = expandedStatus,
                                        onExpandedChange = { expandedStatus = it }
                                    ) {
                                        OutlinedTextField(
                                            value = selectedStatus,
                                            onValueChange = {},
                                            readOnly = true,
                                            label = { Text("4. Pilih Status Guru") },
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
                                    
                                    Spacer(modifier = Modifier.height(8.dp))

                                    // 5. Keterangan
                                    OutlinedTextField(
                                        value = keterangan,
                                        onValueChange = { keterangan = it },
                                        label = { Text("5. Keterangan (Opsional)") },
                                        placeholder = { Text("Contoh: Guru izin sakit") },
                                        modifier = Modifier.fillMaxWidth(),
                                        maxLines = 3
                                    )
                                }
                            }
                        } else {
                            // FORM UNTUK GURU PENGGANTI (Data sudah ada dan ada guru pengganti)
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            // Info status guru asli (read-only)
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Info,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Status Guru Asli",
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    OutlinedTextField(
                                        value = selectedStatus,
                                        onValueChange = {},
                                        readOnly = true,
                                        enabled = false,
                                        label = { Text("Status (Sudah diisi)") },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            // Form input status guru pengganti
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.tertiaryContainer
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onTertiaryContainer
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text(
                                                text = "Form Status Guru Pengganti",
                                                fontWeight = FontWeight.SemiBold,
                                                color = MaterialTheme.colorScheme.onTertiaryContainer
                                            )
                                            if (!guruPenggantiName.isNullOrEmpty()) {
                                                Text(
                                                    text = "Guru: $guruPenggantiName",
                                                    fontSize = 12.sp,
                                                    color = MaterialTheme.colorScheme.onTertiaryContainer
                                                )
                                            }
                                        }
                                    }
                                    
                                    Spacer(modifier = Modifier.height(12.dp))
                                    
                                    // Dropdown status guru pengganti
                                    ExposedDropdownMenuBox(
                                        expanded = expandedStatusGuruPengganti,
                                        onExpandedChange = { expandedStatusGuruPengganti = it }
                                    ) {
                                        OutlinedTextField(
                                            value = selectedStatusGuruPengganti,
                                            onValueChange = {},
                                            readOnly = true,
                                            label = { Text("4. Status Guru Pengganti") },
                                            trailingIcon = {
                                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedStatusGuruPengganti)
                                            },
                                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                                        )
                                        
                                        ExposedDropdownMenu(
                                            expanded = expandedStatusGuruPengganti,
                                            onDismissRequest = { expandedStatusGuruPengganti = false }
                                        ) {
                                            statusList.forEach { status ->
                                                DropdownMenuItem(
                                                    text = { Text(status) },
                                                    onClick = {
                                                        selectedStatusGuruPengganti = status
                                                        expandedStatusGuruPengganti = false
                                                    }
                                                )
                                            }
                                        }
                                    }
                                    
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    // Keterangan untuk guru pengganti
                                    OutlinedTextField(
                                        value = keteranganGuruPengganti,
                                        onValueChange = { keteranganGuruPengganti = it },
                                        label = { Text("5. Keterangan (Opsional)") },
                                        placeholder = { Text("Contoh: Guru pengganti terlambat") },
                                        modifier = Modifier.fillMaxWidth(),
                                        maxLines = 3
                                    )
                                }
                            }
                        }
                    }

                    Divider(modifier = Modifier.padding(vertical = 8.dp))

                    // Button Simpan - kondisional berdasarkan tipe form
                    Button(
                        onClick = { 
                            if (isFormGuruAsli) {
                                // Form guru asli - simpan data baru
                                saveGuruMengajar()
                            } else {
                                // Form guru pengganti - update status guru pengganti
                                existingGuruMengajarId?.let { id ->
                                    updateStatusGuruPengganti(id)
                                }
                            }
                        },
                        enabled = if (isFormGuruAsli) {
                            // Form guru asli: semua field harus terisi
                            jadwalId != null && selectedStatus.isNotEmpty() && !isSaving
                        } else {
                            // Form guru pengganti: hanya status guru pengganti yang harus terisi
                            selectedStatusGuruPengganti.isNotEmpty() && !isSaving
                        },
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
                            Text(
                                if (isFormGuruAsli) "Simpan Status Guru" else "Simpan Status Guru Pengganti", 
                                fontSize = 16.sp, 
                                fontWeight = FontWeight.Bold
                            )
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
                               "• Keterangan bersifat opsional\n" +
                               "• Gunakan tombol 'Isi Status Guru Pengganti' untuk mengisi status guru pengganti yang belum terisi",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
        }
    }
    
    // Dialog untuk memilih dan mengisi status guru pengganti
    if (showGuruPenggantiDialog) {
        AlertDialog(
            onDismissRequest = { 
                showGuruPenggantiDialog = false
                selectedGuruMengajarData = null
                selectedStatusGuruPengganti = ""
                keteranganGuruPengganti = ""
                selectedHariDialog = ""
            },
            title = {
                Text(
                    text = "Guru Pengganti Belum Ada Status",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (selectedGuruMengajarData == null) {
                        // Filter Hari terlebih dahulu
                        Text(
                            text = "Pilih hari terlebih dahulu:",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        
                        ExposedDropdownMenuBox(
                            expanded = expandedHariDialog,
                            onExpandedChange = { expandedHariDialog = it }
                        ) {
                            OutlinedTextField(
                                value = selectedHariDialog,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Pilih Hari") },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedHariDialog)
                                },
                                modifier = Modifier.fillMaxWidth().menuAnchor(),
                                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                            )
                            
                            ExposedDropdownMenu(
                                expanded = expandedHariDialog,
                                onDismissRequest = { expandedHariDialog = false }
                            ) {
                                // Ambil hari unik dari guruPenggantiWithHari
                                val availableHari = guruPenggantiWithHari
                                    .map { it.first }
                                    .distinct()
                                    .sortedBy { hari ->
                                        hariList.indexOf(hari)
                                    }
                                
                                availableHari.forEach { hari ->
                                    DropdownMenuItem(
                                        text = { Text(hari) },
                                        onClick = {
                                            selectedHariDialog = hari
                                            expandedHariDialog = false
                                        }
                                    )
                                }
                            }
                        }
                        
                        // Tampilkan list guru pengganti hanya jika hari sudah dipilih
                        if (selectedHariDialog.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Text(
                                text = "Pilih salah satu guru pengganti untuk diisi statusnya:",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            
                            // Filter berdasarkan hari yang dipilih
                            val filteredList = guruPenggantiWithHari.filter { it.first == selectedHariDialog }
                            
                            if (filteredList.isEmpty()) {
                                Text(
                                    text = "Tidak ada guru pengganti untuk hari $selectedHariDialog",
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )
                            } else {
                                filteredList.forEach { (hari, data) ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                                        ),
                                        onClick = {
                                            selectedGuruMengajarData = data
                                            existingStatus = data.status
                                            existingGuruMengajarId = data.id
                                            guruPenggantiName = data.guruPengganti
                                        }
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(12.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text(
                                                    text = data.namaGuru,
                                                    fontWeight = FontWeight.SemiBold
                                                )
                                                Card(
                                                    colors = CardDefaults.cardColors(
                                                        containerColor = MaterialTheme.colorScheme.errorContainer
                                                    )
                                                ) {
                                                    Text(
                                                        text = when (data.status.lowercase()) {
                                                            "masuk" -> "Masuk"
                                                            "tidak_masuk" -> "Tidak Masuk"
                                                            "izin" -> "Izin"
                                                            else -> data.status
                                                        },
                                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                                        fontSize = 12.sp,
                                                        color = MaterialTheme.colorScheme.onErrorContainer
                                                    )
                                                }
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "${data.mapel} • Jam ${data.jamKe}",
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Person,
                                                    contentDescription = null,
                                                    modifier = Modifier.size(16.dp),
                                                    tint = MaterialTheme.colorScheme.primary
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = "Pengganti: ${data.guruPengganti}",
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // Form untuk mengisi status
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp)
                            ) {
                                Text(
                                    text = "Data Terpilih:",
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Guru: ${selectedGuruMengajarData?.namaGuru}", fontSize = 13.sp)
                                Text("Mapel: ${selectedGuruMengajarData?.mapel} • Jam ${selectedGuruMengajarData?.jamKe}", fontSize = 13.sp)
                                Text("Guru Pengganti: ${selectedGuruMengajarData?.guruPengganti}", fontSize = 13.sp)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Dropdown status guru pengganti
                        ExposedDropdownMenuBox(
                            expanded = expandedStatusGuruPengganti,
                            onExpandedChange = { expandedStatusGuruPengganti = it }
                        ) {
                            OutlinedTextField(
                                value = selectedStatusGuruPengganti,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Status Guru Pengganti") },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedStatusGuruPengganti)
                                },
                                modifier = Modifier.fillMaxWidth().menuAnchor(),
                                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                            )
                            
                            ExposedDropdownMenu(
                                expanded = expandedStatusGuruPengganti,
                                onDismissRequest = { expandedStatusGuruPengganti = false }
                            ) {
                                statusList.forEach { status ->
                                    DropdownMenuItem(
                                        text = { Text(status) },
                                        onClick = {
                                            selectedStatusGuruPengganti = status
                                            expandedStatusGuruPengganti = false
                                        }
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        OutlinedTextField(
                            value = keteranganGuruPengganti,
                            onValueChange = { keteranganGuruPengganti = it },
                            label = { Text("Keterangan (Opsional)") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3
                        )
                    }
                }
            },
            confirmButton = {
                if (selectedGuruMengajarData != null) {
                    Button(
                        onClick = {
                            existingGuruMengajarId?.let { id ->
                                updateStatusGuruPengganti(id)
                            }
                        },
                        enabled = selectedStatusGuruPengganti.isNotEmpty() && !isSaving
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Simpan")
                        }
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        if (selectedGuruMengajarData != null) {
                            // Kembali ke list
                            selectedGuruMengajarData = null
                            selectedStatusGuruPengganti = ""
                            keteranganGuruPengganti = ""
                        } else {
                            // Tutup dialog
                            showGuruPenggantiDialog = false
                            selectedHariDialog = ""
                        }
                    }
                ) {
                    Text(if (selectedGuruMengajarData != null) "Kembali" else "Tutup")
                }
            }
        )
    }
}

