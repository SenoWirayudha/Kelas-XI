package com.komputerkit.aplikasimonitoringkelas.kurikulum.screens

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
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
fun ListKurikulumScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
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
    var isLoadingData by remember { mutableStateOf(false) }
    
    // Ganti guru dialog states
    var showGantiGuruDialog by remember { mutableStateOf(false) }
    var selectedItemForGantiGuru by remember { mutableStateOf<GuruMengajarData?>(null) }
    
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
                Toast.makeText(context, "Gagal load kelas: ${result.message}", Toast.LENGTH_SHORT).show()
            }
            is ApiResult.Loading -> {} // Ignore loading state
        }
        isLoadingKelas = false
    }
    
    // Function to load data
    fun loadGuruMengajarData() {
        if (selectedHari.isEmpty() || selectedKelas == null) {
            Toast.makeText(context, "Pilih hari dan kelas terlebih dahulu", Toast.LENGTH_SHORT).show()
            return
        }
        
        scope.launch {
            isLoadingData = true
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
                    Toast.makeText(context, "Gagal load data: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                is ApiResult.Loading -> {} // Ignore loading state
            }
            isLoadingData = false
        }
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        TopAppBar(
            title = { 
                Column {
                    Text(
                        text = "List Guru Mengajar",
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "$name - $email",
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
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Logout")
                }
            }
        )

        // Scrollable content area
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Hari Dropdown
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Pilih Hari",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    ExposedDropdownMenuBox(
                        expanded = expandedHari,
                        onExpandedChange = { expandedHari = !expandedHari }
                    ) {
                        OutlinedTextField(
                            value = selectedHari,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Hari") },
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
                                        guruMengajarList = emptyList() // Reset data ketika ganti hari
                                        filteredGuruMengajarList = emptyList()
                                    }
                                )
                            }
                        }
                    }
                }
            }
            
            // Filter Dropdown
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Filter Data",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    ExposedDropdownMenuBox(
                        expanded = expandedFilter,
                        onExpandedChange = { expandedFilter = !expandedFilter }
                    ) {
                        OutlinedTextField(
                            value = when (selectedFilter) {
                                "masuk" -> "Guru Masuk"
                                "kosong" -> "Kelas Kosong"
                                else -> "Semua Data"
                            },
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Filter") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedFilter)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor()
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
                }
            }
            
            // Kelas Dropdown
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Pilih Kelas",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    ExposedDropdownMenuBox(
                        expanded = expandedKelas,
                        onExpandedChange = { expandedKelas = !expandedKelas }
                    ) {
                        OutlinedTextField(
                            value = selectedKelas?.nama_kelas ?: "",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Kelas") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKelas)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
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
                                        guruMengajarList = emptyList() // Reset data ketika ganti kelas
                                        filteredGuruMengajarList = emptyList()
                                    }
                                )
                            }
                        }
                    }
                }
            }
            
            // Load Button
            Button(
                onClick = { loadGuruMengajarData() },
                modifier = Modifier.fillMaxWidth(),
                enabled = selectedHari.isNotEmpty() && selectedKelas != null && !isLoadingData
            ) {
                if (isLoadingData) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Tampilkan Data")
            }
            
            Divider(modifier = Modifier.padding(vertical = 8.dp))
            
            // Data List
            if (isLoadingData) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (filteredGuruMengajarList.isNotEmpty()) {
                Text(
                    text = "Total: ${filteredGuruMengajarList.size} data",
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                // Display cards without LazyColumn (use regular Column since parent scrolls)
                filteredGuruMengajarList.forEach { item ->
                    Spacer(modifier = Modifier.height(8.dp))
                    GuruMengajarCard(
                        item = item,
                        onGantiGuru = {
                            selectedItemForGantiGuru = item
                            showGantiGuruDialog = true
                        }
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Text(
                        text = "ℹ️ Pilih hari dan kelas, lalu klik 'Tampilkan Data' untuk melihat daftar guru mengajar",
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
        }
    }
    
    // Ganti Guru Dialog
    if (showGantiGuruDialog && selectedItemForGantiGuru != null) {
        GantiGuruDialog(
            item = selectedItemForGantiGuru!!,
            apiService = apiService,
            tokenManager = tokenManager,
            onDismiss = {
                showGantiGuruDialog = false
                selectedItemForGantiGuru = null
            },
            onSuccess = {
                showGantiGuruDialog = false
                selectedItemForGantiGuru = null
                Toast.makeText(context, "Guru pengganti berhasil disimpan", Toast.LENGTH_SHORT).show()
                loadGuruMengajarData() // Refresh data
            },
            onError = { message ->
                Toast.makeText(context, "Gagal: $message", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@Composable
fun GuruMengajarCard(
    item: GuruMengajarData,
    onGantiGuru: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // ID Badge
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Text(
                        text = "ID: ${item.id}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
                
                // Jam Ke Badge
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Text(
                        text = "Jam ${item.jamKe}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Guru Info
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Guru",
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = item.namaGuru,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Mapel Info
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Mapel",
                    tint = MaterialTheme.colorScheme.secondary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = item.mapel,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Status Badge
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = when (item.status.lowercase()) {
                        "masuk" -> MaterialTheme.colorScheme.primaryContainer
                        "tidak_masuk" -> MaterialTheme.colorScheme.errorContainer
                        "izin" -> MaterialTheme.colorScheme.tertiaryContainer
                        else -> MaterialTheme.colorScheme.secondaryContainer
                    }
                )
            ) {
                Text(
                    text = when (item.status.lowercase()) {
                        "masuk" -> "✓ Masuk"
                        "tidak_masuk" -> "✗ Tidak Masuk"
                        "izin" -> "⊘ Izin"
                        else -> item.status
                    },
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    fontWeight = FontWeight.SemiBold,
                    color = when (item.status.lowercase()) {
                        "masuk" -> MaterialTheme.colorScheme.onPrimaryContainer
                        "tidak_masuk" -> MaterialTheme.colorScheme.onErrorContainer
                        "izin" -> MaterialTheme.colorScheme.onTertiaryContainer
                        else -> MaterialTheme.colorScheme.onSecondaryContainer
                    }
                )
            }
            
            // Guru Pengganti
            if (!item.guruPengganti.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Column {
                            Text(
                                text = "Guru Pengganti:",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                            )
                            Text(
                                text = item.guruPengganti,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                }
            }
            
            // Durasi Izin
            if (!item.izinMulai.isNullOrEmpty() && !item.izinSelesai.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Column {
                            Text(
                                text = "Durasi Izin:",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.7f)
                            )
                            Text(
                                text = "${item.izinMulai} - ${item.izinSelesai}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onTertiaryContainer
                            )
                        }
                    }
                }
            }
            
            // Keterangan
            if (item.keterangan?.isNotEmpty() == true) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Keterangan: ${item.keterangan}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            
            // Show warning if status is izin/tidak_masuk and no pengganti
            if (item.status in listOf("tidak_masuk", "izin") && item.guruPengganti.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onGantiGuru() },
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Tidak Ada Guru Pengganti",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                        
                        IconButton(
                            onClick = onGantiGuru,
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = MaterialTheme.colorScheme.error,
                                contentColor = MaterialTheme.colorScheme.onError
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Ganti Guru"
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditDialog(
    item: GuruMengajarData,
    apiService: ApiService,
    tokenManager: TokenManager,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit,
    onError: (String) -> Unit
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var selectedStatus by remember { mutableStateOf(item.status) }
    var selectedGuruPengganti by remember { mutableStateOf<GuruData?>(null) }
    var keterangan by remember { mutableStateOf(item.keterangan ?: "") }
    var expandedStatus by remember { mutableStateOf(false) }
    var expandedGuruPengganti by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var isLoadingGuru by remember { mutableStateOf(false) }
    var guruList by remember { mutableStateOf<List<GuruData>>(emptyList()) }
    
    val statusList = listOf("masuk", "tidak_masuk", "izin")
    
    // Load guru list when status is tidak_masuk or izin
    LaunchedEffect(selectedStatus) {
        if (selectedStatus in listOf("tidak_masuk", "izin")) {
            isLoadingGuru = true
            try {
                val token = "Bearer ${tokenManager.getToken()}"
                val response = apiService.getAllGurus(token)
                if (response.isSuccessful && response.body() != null) {
                    guruList = response.body()!!.data
                }
            } catch (e: Exception) {
                android.util.Log.e("EditDialog", "Error loading guru: ${e.message}")
            } finally {
                isLoadingGuru = false
            }
        } else {
            selectedGuruPengganti = null
        }
    }
    
    AlertDialog(
        onDismissRequest = { if (!isLoading) onDismiss() },
        title = {
            Text(
                text = "Edit Data Guru Mengajar",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Info
                Text(
                    text = "${item.namaGuru} - ${item.mapel}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Divider()
                
                // Status Dropdown
                Text(
                    text = "Status",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
                
                ExposedDropdownMenuBox(
                    expanded = expandedStatus,
                    onExpandedChange = { expandedStatus = !expandedStatus }
                ) {
                    OutlinedTextField(
                        value = when (selectedStatus) {
                            "masuk" -> "Masuk"
                            "tidak_masuk" -> "Tidak Masuk"
                            "izin" -> "Izin"
                            else -> selectedStatus
                        },
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Pilih Status") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedStatus)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )

                    ExposedDropdownMenu(
                        expanded = expandedStatus,
                        onDismissRequest = { expandedStatus = false }
                    ) {
                        statusList.forEach { status ->
                            DropdownMenuItem(
                                text = { Text(when (status) {
                                    "masuk" -> "Masuk"
                                    "tidak_masuk" -> "Tidak Masuk"
                                    "izin" -> "Izin"
                                    else -> status
                                }) },
                                onClick = {
                                    selectedStatus = status
                                    expandedStatus = false
                                }
                            )
                        }
                    }
                }
                
                // Guru Pengganti Dropdown (only show if status is tidak_masuk or izin)
                if (selectedStatus in listOf("tidak_masuk", "izin")) {
                    Text(
                        text = "Guru Pengganti",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    
                    ExposedDropdownMenuBox(
                        expanded = expandedGuruPengganti,
                        onExpandedChange = { expandedGuruPengganti = !expandedGuruPengganti }
                    ) {
                        OutlinedTextField(
                            value = selectedGuruPengganti?.namaGuru ?: if (isLoadingGuru) "Loading..." else "Pilih Guru Pengganti",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Guru Pengganti") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedGuruPengganti)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            enabled = !isLoadingGuru
                        )

                        ExposedDropdownMenu(
                            expanded = expandedGuruPengganti,
                            onDismissRequest = { expandedGuruPengganti = false }
                        ) {
                            if (isLoadingGuru) {
                                DropdownMenuItem(
                                    text = { Text("Loading...") },
                                    onClick = {}
                                )
                            } else {
                                guruList.forEach { guru ->
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
                    }
                    
                    Text(
                        text = "* Wajib pilih guru pengganti",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.error,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                    )
                }
                
                // Keterangan TextField
                Text(
                    text = "Keterangan",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
                
                OutlinedTextField(
                    value = keterangan,
                    onValueChange = { keterangan = it },
                    label = { Text("Keterangan") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    // Validate: if status is tidak_masuk or izin, guru pengganti must be selected
                    if (selectedStatus in listOf("tidak_masuk", "izin") && selectedGuruPengganti == null) {
                        onError("Guru pengganti wajib dipilih untuk status ${if (selectedStatus == "tidak_masuk") "Tidak Masuk" else "Izin"}")
                        return@Button
                    }
                    
                    scope.launch {
                        isLoading = true
                        val token = "Bearer ${tokenManager.getToken()}"
                        val request = UpdateGuruMengajarRequest(
                            guruPenggantiId = selectedGuruPengganti?.id,
                            status = selectedStatus,
                            keterangan = keterangan.ifEmpty { null }
                        )
                        
                        when (val result = ApiHelper.safeApiCall {
                            apiService.updateGuruMengajar(token, item.id, request)
                        }) {
                            is ApiResult.Success -> {
                                onSuccess()
                            }
                            is ApiResult.Error -> {
                                onError(result.message)
                            }
                            is ApiResult.Loading -> {} // Ignore loading state
                        }
                        isLoading = false
                    }
                },
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Simpan")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isLoading
            ) {
                Text("Batal")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GantiGuruDialog(
    item: GuruMengajarData,
    apiService: ApiService,
    tokenManager: TokenManager,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit,
    onError: (String) -> Unit
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var selectedGuruPengganti by remember { mutableStateOf<GuruData?>(null) }
    var keterangan by remember { mutableStateOf(item.keterangan ?: "") }
    var expandedGuruPengganti by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var isLoadingGuru by remember { mutableStateOf(false) }
    var guruList by remember { mutableStateOf<List<GuruData>>(emptyList()) }
    
    // Load guru list when dialog opens
    LaunchedEffect(Unit) {
        isLoadingGuru = true
        try {
            val token = "Bearer ${tokenManager.getToken()}"
            val response = apiService.getAllGurus(token)
            if (response.isSuccessful && response.body() != null) {
                guruList = response.body()!!.data
            }
        } catch (e: Exception) {
            android.util.Log.e("GantiGuruDialog", "Error loading guru: ${e.message}")
        } finally {
            isLoadingGuru = false
        }
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Ganti Guru Pengganti",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Info Card
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "Informasi Jadwal",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Divider()
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = "Guru: ${item.namaGuru}",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = "Mapel: ${item.mapel}",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = "Jam Ke: ${item.jamKe}",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = "Status: ${when(item.status) {
                                "masuk" -> "Masuk"
                                "tidak_masuk" -> "Tidak Masuk"
                                "izin" -> "Izin"
                                else -> item.status
                            }}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = when(item.status) {
                                "tidak_masuk" -> MaterialTheme.colorScheme.error
                                "izin" -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.onSecondaryContainer
                            }
                        )
                    }
                }
                
                // Guru Pengganti Dropdown
                Text(
                    text = "Guru Pengganti",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
                
                ExposedDropdownMenuBox(
                    expanded = expandedGuruPengganti,
                    onExpandedChange = { expandedGuruPengganti = !expandedGuruPengganti }
                ) {
                    OutlinedTextField(
                        value = selectedGuruPengganti?.namaGuru ?: if (isLoadingGuru) "Loading..." else "Pilih Guru Pengganti",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Guru Pengganti") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedGuruPengganti)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        enabled = !isLoadingGuru
                    )

                    ExposedDropdownMenu(
                        expanded = expandedGuruPengganti,
                        onDismissRequest = { expandedGuruPengganti = false }
                    ) {
                        if (isLoadingGuru) {
                            DropdownMenuItem(
                                text = { Text("Loading...") },
                                onClick = {}
                            )
                        } else {
                            guruList.forEach { guru ->
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
                }
                
                Text(
                    text = "* Wajib pilih guru pengganti",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.error,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
                
                // Keterangan TextField
                Text(
                    text = "Keterangan (Opsional)",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
                
                OutlinedTextField(
                    value = keterangan,
                    onValueChange = { keterangan = it },
                    label = { Text("Keterangan") },
                    placeholder = { Text("Tambahkan keterangan jika diperlukan") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (selectedGuruPengganti == null) {
                        onError("Guru pengganti wajib dipilih")
                        return@Button
                    }
                    
                    scope.launch {
                        isLoading = true
                        val token = "Bearer ${tokenManager.getToken()}"
                        val request = UpdateGuruMengajarRequest(
                            guruPenggantiId = selectedGuruPengganti?.id,
                            status = item.status, // Keep the same status
                            keterangan = keterangan.ifEmpty { null }
                        )
                        
                        when (val result = ApiHelper.safeApiCall {
                            apiService.updateGuruMengajar(token, item.id, request)
                        }) {
                            is ApiResult.Success -> {
                                onSuccess()
                            }
                            is ApiResult.Error -> {
                                onError(result.message)
                            }
                            is ApiResult.Loading -> {} // Ignore loading state
                        }
                        isLoading = false
                    }
                },
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Simpan")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isLoading
            ) {
                Text("Batal")
            }
        }
    )
}
