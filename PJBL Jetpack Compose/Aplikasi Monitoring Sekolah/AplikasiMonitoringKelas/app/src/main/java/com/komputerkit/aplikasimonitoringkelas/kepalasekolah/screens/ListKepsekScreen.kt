package com.komputerkit.aplikasimonitoringkelas.kepalasekolah.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
fun ListKepsekScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }
    val apiService = remember { ApiClient.getApiService() }
    
    // States
    var selectedHari by remember { mutableStateOf("") }
    var selectedKelas by remember { mutableStateOf<KelasData?>(null) }
    var selectedFilter by remember { mutableStateOf("all") } // all, masuk, kosong
    var expandedHari by remember { mutableStateOf(false) }
    var expandedKelas by remember { mutableStateOf(false) }
    var expandedFilter by remember { mutableStateOf(false) }
    
    var kelasList by remember { mutableStateOf<List<KelasData>>(emptyList()) }
    var guruMengajarList by remember { mutableStateOf<List<GuruMengajarData>>(emptyList()) }
    var filteredGuruMengajarList by remember { mutableStateOf<List<GuruMengajarData>>(emptyList()) }
    
    var isLoadingKelas by remember { mutableStateOf(false) }
    var isLoadingGuruMengajar by remember { mutableStateOf(false) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat")
    
    // Load kelas list when screen opens
    LaunchedEffect(Unit) {
        isLoadingKelas = true
        val token = "Bearer ${tokenManager.getToken()}"
        when (val result = ApiHelper.safeApiCall { apiService.getAllKelas(token) }) {
            is ApiResult.Success -> {
                kelasList = result.data.data
            }
            is ApiResult.Error -> {
                Toast.makeText(context, "Error loading kelas: ${result.message}", Toast.LENGTH_SHORT).show()
            }
            ApiResult.Loading -> {}
        }
        isLoadingKelas = false
    }
    
    // Function to load guru mengajar
    fun loadGuruMengajar() {
        if (selectedKelas == null || selectedHari.isEmpty()) {
            Toast.makeText(context, "Pilih Kelas dan Hari terlebih dahulu", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isLoadingGuruMengajar = true
            val token = "Bearer ${tokenManager.getToken()}"
            val request = GuruMengajarByHariKelasRequest(
                hari = selectedHari,
                kelasId = selectedKelas!!.id
            )
            
            when (val result = ApiHelper.safeApiCall { 
                apiService.getGuruMengajarByHariKelas(token, request) 
            }) {
                is ApiResult.Success -> {
                    guruMengajarList = result.data.data
                    // Apply filter
                    filteredGuruMengajarList = when (selectedFilter) {
                        "masuk" -> guruMengajarList.filter { 
                            it.status == "masuk" || !it.guruPengganti.isNullOrEmpty()
                        }
                        "kosong" -> guruMengajarList.filter { 
                            it.status in listOf("tidak_masuk", "izin") && it.guruPengganti.isNullOrEmpty()
                        }
                        else -> guruMengajarList
                    }
                    if (filteredGuruMengajarList.isEmpty()) {
                        Toast.makeText(context, "Tidak ada data untuk filter ini", Toast.LENGTH_SHORT).show()
                    }
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                    guruMengajarList = emptyList()
                }
                ApiResult.Loading -> {}
            }
            isLoadingGuruMengajar = false
        }
    }

    Column(Modifier.fillMaxSize()) {
        // Top App Bar
        TopAppBar(
            title = { 
                Column {
                    Text("Laporan Guru Mengajar", fontWeight = FontWeight.Bold)
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
                    Icon(
                        imageVector = Icons.Default.ExitToApp,
                        contentDescription = "Logout"
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Logout")
                }
            }
        )
        
        // Scrollable Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Filter Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
            Text(
                text = "Filter Data",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Spinner Hari
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
                                guruMengajarList = emptyList()
                                filteredGuruMengajarList = emptyList()
                                // Auto load if kelas already selected
                                if (selectedKelas != null) {
                                    loadGuruMengajar()
                                }
                            }
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Filter Dropdown
            ExposedDropdownMenuBox(
                expanded = expandedFilter,
                onExpandedChange = { expandedFilter = it },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = when (selectedFilter) {
                        "masuk" -> "Guru Masuk"
                        "kosong" -> "Kelas Kosong"
                        else -> "Semua Data"
                    },
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Filter Data") },
                    trailingIcon = {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedFilter)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                )

                ExposedDropdownMenu(
                    expanded = expandedFilter,
                    onDismissRequest = { expandedFilter = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Semua Data") },
                        onClick = {
                            selectedFilter = "all"
                            expandedFilter = false
                            // Re-apply filter
                            filteredGuruMengajarList = guruMengajarList
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Guru Masuk") },
                        onClick = {
                            selectedFilter = "masuk"
                            expandedFilter = false
                            // Re-apply filter
                            filteredGuruMengajarList = guruMengajarList.filter { 
                                it.status == "masuk" || !it.guruPengganti.isNullOrEmpty()
                            }
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Kelas Kosong") },
                        onClick = {
                            selectedFilter = "kosong"
                            expandedFilter = false
                            // Re-apply filter
                            filteredGuruMengajarList = guruMengajarList.filter { 
                                it.status in listOf("tidak_masuk", "izin") && it.guruPengganti.isNullOrEmpty()
                            }
                        }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Spinner Kelas
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
                        if (isLoadingKelas) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        } else {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKelas)
                        }
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
                    kelasList.forEach { kelas ->
                        DropdownMenuItem(
                            text = { Text("${kelas.nama_kelas} (ID: ${kelas.id})") },
                            onClick = {
                                selectedKelas = kelas
                                expandedKelas = false
                                guruMengajarList = emptyList()
                                filteredGuruMengajarList = emptyList()
                                // Auto load if hari already selected
                                if (selectedHari.isNotEmpty()) {
                                    loadGuruMengajar()
                                }
                            }
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Button Tampilkan
            Button(
                onClick = { loadGuruMengajar() },
                enabled = selectedHari.isNotEmpty() && selectedKelas != null && !isLoadingGuruMengajar,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoadingGuruMengajar) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Loading...")
                } else {
                    Icon(Icons.Default.Search, contentDescription = "Tampilkan")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Tampilkan Data")
                }
            }
        }
        
        Divider()
        
        // Info Card
        if (selectedHari.isNotEmpty() && selectedKelas != null) {
            Card(
                Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                )
            ) {
                Column(
                    Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "${filteredGuruMengajarList.size}",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                    Text(
                        text = "Guru mengajar ${selectedKelas?.nama_kelas} - $selectedHari",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
        }
        
        // List Section
        if (filteredGuruMengajarList.isEmpty() && selectedHari.isNotEmpty() && selectedKelas != null && !isLoadingGuruMengajar) {
            // Empty state
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .height(200.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "No Data",
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Tidak ada data",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Belum ada data guru mengajar untuk kelas dan hari ini",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else if (filteredGuruMengajarList.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                filteredGuruMengajarList.forEach { guruMengajar ->
                    GuruMengajarCard(guruMengajar = guruMengajar)
                }
                
                // Add bottom padding
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
        }
    }
}

@Composable
fun GuruMengajarCard(guruMengajar: GuruMengajarData) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = when (guruMengajar.status.lowercase()) {
                "tidak masuk" -> MaterialTheme.colorScheme.errorContainer
                "masuk" -> MaterialTheme.colorScheme.primaryContainer
                else -> MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Status Badge
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = when (guruMengajar.status.lowercase()) {
                            "tidak masuk" -> MaterialTheme.colorScheme.error
                            "masuk" -> MaterialTheme.colorScheme.primary
                            else -> MaterialTheme.colorScheme.tertiary
                        }
                    )
                ) {
                    Text(
                        text = guruMengajar.status.uppercase(),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
                
                // ID Badge
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Text(
                        text = "ID: ${guruMengajar.id}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Nama Guru
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Guru",
                    modifier = Modifier.size(24.dp),
                    tint = when (guruMengajar.status.lowercase()) {
                        "tidak masuk" -> MaterialTheme.colorScheme.onErrorContainer
                        else -> MaterialTheme.colorScheme.onPrimaryContainer
                    }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = guruMengajar.namaGuru,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = when (guruMengajar.status.lowercase()) {
                        "tidak masuk" -> MaterialTheme.colorScheme.onErrorContainer
                        else -> MaterialTheme.colorScheme.onPrimaryContainer
                    }
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Mata Pelajaran
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = "Mapel",
                    modifier = Modifier.size(20.dp),
                    tint = when (guruMengajar.status.lowercase()) {
                        "tidak masuk" -> MaterialTheme.colorScheme.onErrorContainer
                        else -> MaterialTheme.colorScheme.onPrimaryContainer
                    }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = guruMengajar.mapel,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = when (guruMengajar.status.lowercase()) {
                        "tidak masuk" -> MaterialTheme.colorScheme.onErrorContainer
                        else -> MaterialTheme.colorScheme.onPrimaryContainer
                    }
                )
            }
            
            // Keterangan (if available)
            if (!guruMengajar.keterangan.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Divider()
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(verticalAlignment = Alignment.Top) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "Keterangan",
                        modifier = Modifier.size(20.dp),
                        tint = when (guruMengajar.status.lowercase()) {
                            "tidak masuk" -> MaterialTheme.colorScheme.onErrorContainer
                            else -> MaterialTheme.colorScheme.onPrimaryContainer
                        }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = guruMengajar.keterangan,
                        fontSize = 14.sp,
                        color = when (guruMengajar.status.lowercase()) {
                            "tidak masuk" -> MaterialTheme.colorScheme.onErrorContainer
                            else -> MaterialTheme.colorScheme.onPrimaryContainer
                        }
                    )
                }
            }
            
            // Guru Pengganti
            if (!guruMengajar.guruPengganti.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.6f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Guru Pengganti:",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                            )
                            Text(
                                text = guruMengajar.guruPengganti,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                }
            } else if (guruMengajar.status in listOf("tidak_masuk", "izin")) {
                // Show warning if no substitute teacher
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
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
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Belum Ada Guru Pengganti",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
            
            // Durasi Izin
            if (!guruMengajar.izinMulai.isNullOrEmpty() && !guruMengajar.izinSelesai.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.6f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Durasi Izin:",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.7f)
                            )
                            Text(
                                text = "${guruMengajar.izinMulai} - ${guruMengajar.izinSelesai}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onTertiaryContainer
                            )
                        }
                    }
                }
            }
        }
    }
}

