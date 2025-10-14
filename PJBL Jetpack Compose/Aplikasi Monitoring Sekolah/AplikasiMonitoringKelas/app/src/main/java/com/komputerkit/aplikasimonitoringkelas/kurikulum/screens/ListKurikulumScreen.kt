package com.komputerkit.aplikasimonitoringkelas.kurikulum.screens

import android.widget.Toast
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
    var expandedHari by remember { mutableStateOf(false) }
    var expandedKelas by remember { mutableStateOf(false) }
    
    var kelasList by remember { mutableStateOf<List<KelasData>>(emptyList()) }
    var guruMengajarList by remember { mutableStateOf<List<GuruMengajarData>>(emptyList()) }
    
    var isLoadingKelas by remember { mutableStateOf(false) }
    var isLoadingData by remember { mutableStateOf(false) }
    
    // Edit dialog states
    var showEditDialog by remember { mutableStateOf(false) }
    var editingItem by remember { mutableStateOf<GuruMengajarData?>(null) }
    
    val hariList = listOf("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
    
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
                    if (guruMengajarList.isEmpty()) {
                        Toast.makeText(context, "Tidak ada data untuk hari dan kelas ini", Toast.LENGTH_SHORT).show()
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
    
    // Function to delete item
    fun deleteItem(id: Int) {
        scope.launch {
            val token = "Bearer ${tokenManager.getToken()}"
            when (val result = ApiHelper.safeApiCall { 
                apiService.deleteGuruMengajar(token, id) 
            }) {
                is ApiResult.Success -> {
                    Toast.makeText(context, "Data berhasil dihapus", Toast.LENGTH_SHORT).show()
                    // Refresh data
                    loadGuruMengajarData()
                }
                is ApiResult.Error -> {
                    Toast.makeText(context, "Gagal hapus data: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                is ApiResult.Loading -> {} // Ignore loading state
            }
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
                                    }
                                )
                            }
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
            } else if (guruMengajarList.isNotEmpty()) {
                Text(
                    text = "Total: ${guruMengajarList.size} data",
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                // Display cards without LazyColumn (use regular Column since parent scrolls)
                guruMengajarList.forEach { item ->
                    Spacer(modifier = Modifier.height(8.dp))
                    GuruMengajarCard(
                        item = item,
                        onEdit = {
                            editingItem = item
                            showEditDialog = true
                        },
                        onDelete = {
                            deleteItem(item.id)
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
    
    // Edit Dialog
    if (showEditDialog && editingItem != null) {
        EditDialog(
            item = editingItem!!,
            apiService = apiService,
            tokenManager = tokenManager,
            onDismiss = { 
                showEditDialog = false
                editingItem = null
            },
            onSuccess = {
                showEditDialog = false
                editingItem = null
                Toast.makeText(context, "Data berhasil diupdate", Toast.LENGTH_SHORT).show()
                loadGuruMengajarData() // Refresh data
            },
            onError = { message ->
                Toast.makeText(context, "Gagal update: $message", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@Composable
fun GuruMengajarCard(
    item: GuruMengajarData,
    onEdit: () -> Unit,
    onDelete: () -> Unit
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
                    containerColor = if (item.status == "masuk") 
                        MaterialTheme.colorScheme.primaryContainer 
                    else 
                        MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Text(
                    text = if (item.status == "masuk") "✓ Masuk" else "✗ Tidak Masuk",
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    fontWeight = FontWeight.SemiBold,
                    color = if (item.status == "masuk") 
                        MaterialTheme.colorScheme.onPrimaryContainer 
                    else 
                        MaterialTheme.colorScheme.onErrorContainer
                )
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
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onEdit,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit")
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Edit")
                }
                
                OutlinedButton(
                    onClick = onDelete,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete")
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Hapus")
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
    var selectedStatus by remember { mutableStateOf(item.status) }
    var keterangan by remember { mutableStateOf(item.keterangan ?: "") }
    var expandedStatus by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    
    val statusList = listOf("masuk", "tidak_masuk")
    
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
                        value = if (selectedStatus == "masuk") "Masuk" else "Tidak Masuk",
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
                                text = { Text(if (status == "masuk") "Masuk" else "Tidak Masuk") },
                                onClick = {
                                    selectedStatus = status
                                    expandedStatus = false
                                }
                            )
                        }
                    }
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
                    scope.launch {
                        isLoading = true
                        val token = "Bearer ${tokenManager.getToken()}"
                        val request = UpdateGuruMengajarRequest(
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
