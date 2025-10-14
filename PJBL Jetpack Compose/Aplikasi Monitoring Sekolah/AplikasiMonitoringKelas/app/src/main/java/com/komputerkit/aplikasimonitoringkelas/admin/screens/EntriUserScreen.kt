package com.komputerkit.aplikasimonitoringkelas.admin.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.aplikasimonitoringkelas.api.TokenManager
import com.komputerkit.aplikasimonitoringkelas.api.ApiClient
import com.komputerkit.aplikasimonitoringkelas.api.ApiConfig
import com.komputerkit.aplikasimonitoringkelas.api.ApiHelper
import com.komputerkit.aplikasimonitoringkelas.api.ApiResult
import com.komputerkit.aplikasimonitoringkelas.api.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EntriUserScreen(role: String, email: String, name: String, onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = TokenManager(context)
    val apiService = ApiClient.getApiService()
    
    // Form states
    var selectedRole by remember { mutableStateOf("") }
    var nama by remember { mutableStateOf("") }
    var userEmail by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordConfirmation by remember { mutableStateOf("") }
    
    // Validation states
    var emailError by remember { mutableStateOf(false) }
    var passwordMatchError by remember { mutableStateOf(false) }
    
    // Dropdown expansion
    var expandedRole by remember { mutableStateOf(false) }
    
    // Data list
    var userList by remember { mutableStateOf<List<UserData>>(emptyList()) }
    
    // Loading states
    var isLoading by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    
    // Edit/Delete dialog states
    var showEditDialog by remember { mutableStateOf(false) }
    var editingUser by remember { mutableStateOf<UserData?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var deletingUser by remember { mutableStateOf<UserData?>(null) }
    
    val roleList = listOf("siswa", "kurikulum", "kepala_sekolah", "admin")
    val roleDisplayMap = mapOf(
        "siswa" to "Siswa",
        "kurikulum" to "Kurikulum",
        "kepala_sekolah" to "Kepala Sekolah",
        "admin" to "Admin"
    )
    
    val isFormValid = selectedRole.isNotBlank() && 
                      nama.isNotBlank() && 
                      userEmail.isNotBlank() && 
                      !emailError && 
                      password.isNotBlank() &&
                      passwordConfirmation.isNotBlank() &&
                      !passwordMatchError
    
    // Email validation
    LaunchedEffect(userEmail) {
        emailError = userEmail.isNotBlank() && !android.util.Patterns.EMAIL_ADDRESS.matcher(userEmail).matches()
    }
    
    // Password match validation
    LaunchedEffect(password, passwordConfirmation) {
        passwordMatchError = passwordConfirmation.isNotBlank() && password != passwordConfirmation
    }
    
    // Function to load users - MANUAL via button - SIMPLIFIED
    fun loadUsers() {
        scope.launch {
            isLoading = true
            
            try {
                android.util.Log.d("EntriUser", "========== LOADING USERS ==========")
                android.util.Log.d("EntriUser", "API URL: ${ApiConfig.BASE_URL}users")
                
                val token = "Bearer ${tokenManager.getToken()}"
                android.util.Log.d("EntriUser", "Token: $token")
                
                when (val result = ApiHelper.safeApiCall { apiService.getAllUsers(token) }) {
                    is ApiResult.Success -> {
                        userList = result.data.data
                        android.util.Log.d("EntriUser", "✓ SUCCESS! Loaded ${userList.size} users")
                    }
                    is ApiResult.Error -> {
                        android.util.Log.e("EntriUser", "✗ API Error: ${result.message}")
                    }
                    ApiResult.Loading -> {}
                }
            } catch (e: Exception) {
                android.util.Log.e("EntriUser", "✗ EXCEPTION: ${e.javaClass.simpleName}: ${e.message}")
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }
    
    // Auto-load users saat screen pertama kali dibuka
    LaunchedEffect(Unit) {
        loadUsers()
    }
    
    // Function to save user
    fun saveUser() {
        if (!isFormValid) return
        
        scope.launch(Dispatchers.IO) {
            withContext(Dispatchers.Main) { isSaving = true }
            
            try {
                val token = "Bearer ${tokenManager.getToken()}"
                val request = CreateUserRequest(
                    role = selectedRole,
                    name = nama,
                    email = userEmail,
                    password = password,
                    password_confirmation = passwordConfirmation
                )
                
                android.util.Log.d("EntriUser", "Creating user: ${request.email}")
                
                when (val result = ApiHelper.safeApiCall { apiService.createUser(token, request) }) {
                    is ApiResult.Success -> {
                        android.util.Log.d("EntriUser", "✓ User created successfully")
                        withContext(Dispatchers.Main) {
                            // Reset form
                            selectedRole = ""
                            nama = ""
                            userEmail = ""
                            password = ""
                            passwordConfirmation = ""
                            
                            // Reload user list
                            loadUsers()
                        }
                    }
                    is ApiResult.Error -> {
                        android.util.Log.e("EntriUser", "✗ Save failed: ${result.message}")
                    }
                    ApiResult.Loading -> {}
                }
            } catch (e: Exception) {
                android.util.Log.e("EntriUser", "✗ Save ERROR: ${e.message}", e)
            } finally {
                withContext(Dispatchers.Main) { isSaving = false }
            }
        }
    }
    
    // Function to delete user
    fun deleteUser(userId: Int) {
        scope.launch(Dispatchers.IO) {
            try {
                val token = "Bearer ${tokenManager.getToken()}"
                android.util.Log.d("EntriUser", "Deleting user ID: $userId")
                
                when (val result = ApiHelper.safeApiCall { apiService.deleteUser(token, userId) }) {
                    is ApiResult.Success -> {
                        android.util.Log.d("EntriUser", "✓ User deleted successfully")
                        loadUsers()
                    }
                    is ApiResult.Error -> {
                        android.util.Log.e("EntriUser", "✗ Delete failed: ${result.message}")
                    }
                    ApiResult.Loading -> {}
                }
            } catch (e: Exception) {
                android.util.Log.e("EntriUser", "✗ Delete ERROR: ${e.message}", e)
            }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Entri User") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                ),
                actions = {
                    // TOMBOL REFRESH - Klik ini untuk load data!
                    IconButton(
                        onClick = { loadUsers() },
                        enabled = !isLoading
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh Data",
                            tint = Color.White
                        )
                    }
                    IconButton(onClick = { /* TODO: Back to dashboard */ }) {
                        Icon(
                            imageVector = Icons.Default.Home,
                            contentDescription = "Home",
                            tint = Color.White
                        )
                    }
                    IconButton(onClick = { onLogout() }) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Logout",
                            tint = Color.White
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Pesan instruksi
            item {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = if (isLoading) "Loading users..." 
                                   else "Klik tombol Refresh (↻) di atas untuk load user list!",
                            fontSize = 14.sp
                        )
                    }
                }
            }
            
            // Form Title
            item {
                Text(
                    text = "Tambah User Baru",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            // Dropdown Role
            item {
                ExposedDropdownMenuBox(
                    expanded = expandedRole,
                    onExpandedChange = { expandedRole = it }
                ) {
                    OutlinedTextField(
                        value = roleDisplayMap[selectedRole] ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Role") },
                        trailingIcon = {
                            Icon(
                                imageVector = if (expandedRole) Icons.Default.KeyboardArrowUp 
                                             else Icons.Default.KeyboardArrowDown,
                                contentDescription = null
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedRole,
                        onDismissRequest = { expandedRole = false }
                    ) {
                        roleList.forEach { role ->
                            DropdownMenuItem(
                                text = { Text(roleDisplayMap[role] ?: role) },
                                onClick = {
                                    selectedRole = role
                                    expandedRole = false
                                }
                            )
                        }
                    }
                }
            }
            
            // Input Nama
            item {
                OutlinedTextField(
                    value = nama,
                    onValueChange = { nama = it },
                    label = { Text("Nama") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            // Input Email
            item {
                OutlinedTextField(
                    value = userEmail,
                    onValueChange = { userEmail = it },
                    label = { Text("Email") },
                    isError = emailError,
                    supportingText = {
                        if (emailError) Text("Format email tidak valid")
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            // Input Password
            item {
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            // Input Password Confirmation
            item {
                OutlinedTextField(
                    value = passwordConfirmation,
                    onValueChange = { passwordConfirmation = it },
                    label = { Text("Konfirmasi Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    isError = passwordMatchError,
                    supportingText = {
                        if (passwordMatchError) Text("Password tidak cocok")
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            // Button Simpan
            item {
                Button(
                    onClick = { saveUser() },
                    enabled = isFormValid && !isSaving && !isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(if (isSaving) "Menyimpan..." else "Simpan User")
                }
            }
            
            // Daftar User
            item {
                Text(
                    text = "Daftar User (${userList.size})",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
            
            items(userList) { user ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = user.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = user.email,
                                fontSize = 14.sp,
                                color = Color.Gray
                            )
                            Text(
                                text = roleDisplayMap[user.role] ?: user.role,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        IconButton(
                            onClick = {
                                deletingUser = user
                                showDeleteDialog = true
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Delete User",
                                tint = Color.Red
                            )
                        }
                    }
                }
            }
        }
    }
    
    // Delete Confirmation Dialog
    if (showDeleteDialog && deletingUser != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Konfirmasi Hapus") },
            text = { Text("Yakin ingin menghapus user ${deletingUser?.name}?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        deletingUser?.let { deleteUser(it.id) }
                        showDeleteDialog = false
                        deletingUser = null
                    }
                ) {
                    Text("Hapus", color = Color.Red)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }
}
