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
fun ListScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    // API Setup
    val tokenManager = remember { TokenManager(context) }
    val apiService = remember { ApiClient.getApiService() }
    
    // State management
    var selectedHari by remember { mutableStateOf("Senin") }
    var expandedHari by remember { mutableStateOf(false) }
    
    var selectedKelas by remember { mutableStateOf<KelasData?>(null) }
    var expandedKelas by remember { mutableStateOf(false) }
    var kelasList by remember { mutableStateOf<List<KelasData>>(emptyList()) }
    var isLoadingKelas by remember { mutableStateOf(false) }
    
    var guruMengajarList by remember { mutableStateOf<List<GuruMengajarData>>(emptyList()) }
    var isLoadingData by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    // State untuk dialog edit
    var showEditDialog by remember { mutableStateOf(false) }
    var selectedItem by remember { mutableStateOf<GuruMengajarData?>(null) }
    var editStatus by remember { mutableStateOf("") }
    var editKeterangan by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    
    // Load kelas list on screen open
    LaunchedEffect(Unit) {
        isLoadingKelas = true
        try {
            val response = apiService.getKelas()
            kelasList = response.data
            if (kelasList.isNotEmpty()) {
                selectedKelas = kelasList[0]
            }
        } catch (e: Exception) {
            Toast.makeText(context, e.message ?: "Error loading kelas", Toast.LENGTH_SHORT).show()
        }
        isLoadingKelas = false
    }
    
    // Load guru mengajar when hari and kelas selected
    LaunchedEffect(selectedHari, selectedKelas) {
        if (selectedKelas != null) {
            isLoadingData = true
            errorMessage = null
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
                    if (guruMengajarList.isEmpty()) {
                        errorMessage = "Tidak ada data guru mengajar untuk hari ${selectedHari} di kelas ${selectedKelas!!.nama_kelas}"
                    }
                }
                is ApiResult.Error -> {
                    errorMessage = result.message
                    guruMengajarList = emptyList()
                }
                is ApiResult.Loading -> {}
            }
            isLoadingData = false
        }
    }
    
    // Function untuk update status
    fun updateGuruMengajar(id: Int, status: String, keterangan: String?) {
        scope.launch {
            isSaving = true
            val token = "Bearer ${tokenManager.getToken()}"
            val request = UpdateGuruMengajarRequest(
                status = status,
                keterangan = keterangan
            )
            
            when (val result = ApiHelper.safeApiCall { 
                apiService.updateGuruMengajar(token, id, request) 
            }) {
                is ApiResult.Success -> {
                    Toast.makeText(context, "Berhasil update data", Toast.LENGTH_SHORT).show()
                    showEditDialog = false
                    
                    // Reload data
                    if (selectedKelas != null) {
                        val reloadRequest = GuruMengajarByHariKelasRequest(
                            hari = selectedHari,
                            kelasId = selectedKelas!!.id
                        )
                        when (val reloadResult = ApiHelper.safeApiCall { 
                            apiService.getGuruMengajarByHariKelas(token, reloadRequest) 
                        }) {
                            is ApiResult.Success -> {
                                guruMengajarList = reloadResult.data.data
                            }
                            is ApiResult.Error -> {}
                            is ApiResult.Loading -> {}
                        }
                    }
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, result.message, Toast.LENGTH_LONG).show()
                }
                is ApiResult.Loading -> {}
            }
            isSaving = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Daftar Guru Mengajar", fontWeight = FontWeight.Bold)
                        Text("$name - $email", fontSize = 12.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, "Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Filter Section
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Filter Data",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Dropdown Hari
                    ExposedDropdownMenuBox(
                        expanded = expandedHari,
                        onExpandedChange = { expandedHari = it }
                    ) {
                        OutlinedTextField(
                            value = selectedHari,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Pilih Hari") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedHari) },
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
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Dropdown Kelas
                    ExposedDropdownMenuBox(
                        expanded = expandedKelas,
                        onExpandedChange = { expandedKelas = it }
                    ) {
                        OutlinedTextField(
                            value = selectedKelas?.nama_kelas ?: "Loading...",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Pilih Kelas") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKelas) },
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
            }
            
            // Content Section
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
            ) {
                when {
                    isLoadingData -> {
                        CircularProgressIndicator(
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    errorMessage != null -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = errorMessage ?: "",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                    guruMengajarList.isEmpty() -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.DateRange,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "Belum ada data",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                    else -> {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            item {
                                Spacer(modifier = Modifier.height(4.dp))
                            }
                            
                            items(guruMengajarList) { item ->
                                GuruMengajarCard(
                                    item = item,
                                    onEditClick = {
                                        selectedItem = item
                                        editStatus = item.status
                                        editKeterangan = item.keterangan ?: ""
                                        showEditDialog = true
                                    }
                                )
                            }
                            
                            item {
                                Spacer(modifier = Modifier.height(16.dp))
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Edit Dialog
    if (showEditDialog && selectedItem != null) {
        var expandedStatus by remember { mutableStateOf(false) }
        
        AlertDialog(
            onDismissRequest = { 
                if (!isSaving) showEditDialog = false 
            },
            title = { Text("Edit Status Guru Mengajar") },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Guru: ${selectedItem!!.namaGuru}",
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Mapel: ${selectedItem!!.mapel}",
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Jam ke: ${selectedItem!!.jamKe}",
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    
                    // Dropdown Status
                    ExposedDropdownMenuBox(
                        expanded = expandedStatus,
                        onExpandedChange = { expandedStatus = it }
                    ) {
                        OutlinedTextField(
                            value = when(editStatus) {
                                "masuk" -> "Masuk"
                                "tidak_masuk" -> "Tidak Masuk"
                                else -> editStatus
                            },
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Status") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedStatus) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                        )
                        
                        ExposedDropdownMenu(
                            expanded = expandedStatus,
                            onDismissRequest = { expandedStatus = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("Masuk") },
                                onClick = {
                                    editStatus = "masuk"
                                    expandedStatus = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Tidak Masuk") },
                                onClick = {
                                    editStatus = "tidak_masuk"
                                    expandedStatus = false
                                }
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // TextField Keterangan
                    OutlinedTextField(
                        value = editKeterangan,
                        onValueChange = { editKeterangan = it },
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
                        updateGuruMengajar(
                            selectedItem!!.id,
                            editStatus,
                            editKeterangan.ifEmpty { null }
                        )
                    },
                    enabled = !isSaving
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
            },
            dismissButton = {
                TextButton(
                    onClick = { showEditDialog = false },
                    enabled = !isSaving
                ) {
                    Text("Batal")
                }
            }
        )
    }
}

@Composable
fun GuruMengajarCard(
    item: GuruMengajarData,
    onEditClick: () -> Unit
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
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = item.namaGuru,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.secondary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = item.mapel,
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.tertiary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Jam ke: ${item.jamKe}",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                IconButton(onClick = onEditClick) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Edit",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            HorizontalDivider()
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = when (item.status.lowercase()) {
                            "masuk" -> MaterialTheme.colorScheme.primaryContainer
                            "tidak_masuk" -> MaterialTheme.colorScheme.errorContainer
                            else -> MaterialTheme.colorScheme.secondaryContainer
                        }
                    )
                ) {
                    Text(
                        text = when (item.status.lowercase()) {
                            "masuk" -> "Masuk"
                            "tidak_masuk" -> "Tidak Masuk"
                            else -> item.status
                        },
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = when (item.status.lowercase()) {
                            "masuk" -> MaterialTheme.colorScheme.onPrimaryContainer
                            "tidak_masuk" -> MaterialTheme.colorScheme.onErrorContainer
                            else -> MaterialTheme.colorScheme.onSecondaryContainer
                        }
                    )
                }
            }
            
            if (!item.keterangan.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = item.keterangan,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}
