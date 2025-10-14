package com.komputerkit.aplikasimonitoringkelas

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.util.Patterns
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.aplikasimonitoringkelas.api.ApiResult
import com.komputerkit.aplikasimonitoringkelas.ui.theme.AplikasiMonitoringKelasTheme
import com.komputerkit.aplikasimonitoringkelas.viewmodel.AuthViewModel

class LoginActivity : ComponentActivity() {
    
    private lateinit var authViewModel: AuthViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize ViewModel
        authViewModel = AuthViewModel(this)
        
        // Check if already logged in
        if (authViewModel.isLoggedIn.value) {
            navigateToRoleActivity(authViewModel.getUserRole() ?: "siswa")
            finish()
            return
        }
        
        enableEdgeToEdge()
        setContent {
            AplikasiMonitoringKelasTheme {
                LoginScreenWithAuth(
                    authViewModel = authViewModel,
                    onLoginSuccess = { role ->
                        navigateToRoleActivity(role)
                        finish()
                    }
                )
            }
        }
    }
    
    private fun navigateToRoleActivity(role: String) {
        val intent = when (role.lowercase()) {
            "siswa" -> Intent(this, SiswaActivity::class.java)
            "kurikulum" -> Intent(this, KurikulumActivity::class.java)
            "kepala_sekolah" -> Intent(this, KepalaSekolahActivity::class.java)
            "admin" -> Intent(this, AdminActivity::class.java)
            else -> {
                Log.e("LoginActivity", "Unknown role: $role, navigating to MainActivity")
                Intent(this, MainActivity::class.java)
            }
        }
        // Kirim data user ke activity tujuan
        intent.putExtra("ROLE", role)
        intent.putExtra("EMAIL", authViewModel.getUserEmail() ?: "")
        intent.putExtra("NAME", authViewModel.getUserName() ?: "")
        startActivity(intent)
        finish() // Close login activity
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreenWithAuth(
    authViewModel: AuthViewModel,
    onLoginSuccess: (String) -> Unit
) {
    val loginState by authViewModel.loginState.collectAsState()
    
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var emailError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    // Handle login state changes
    LaunchedEffect(loginState) {
        when (val state = loginState) {
            is ApiResult.Success -> {
                isLoading = false
                val userRole = authViewModel.getUserRole()
                Log.d("LoginActivity", "Login success! Role: $userRole")
                if (userRole != null) {
                    onLoginSuccess(userRole)
                } else {
                    errorMessage = "Role tidak ditemukan"
                }
            }
            is ApiResult.Error -> {
                isLoading = false
                errorMessage = state.message
                Log.e("LoginActivity", "Login error: ${state.message}")
            }
            is ApiResult.Loading -> {
                isLoading = true
                errorMessage = null
            }
            null -> {
                isLoading = false
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo Sekolah
            Image(
                painter = painterResource(id = R.drawable.logo_sekolah),
                contentDescription = "Logo Sekolah",
                modifier = Modifier.size(120.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Title
            Text(
                text = "Aplikasi Monitoring Kelas",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Silakan login untuk melanjutkan",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Error Message
            if (errorMessage != null) {
                Text(
                    text = errorMessage ?: "",
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }

            // Email TextField
            OutlinedTextField(
                value = email,
                onValueChange = {
                    email = it
                    emailError = it.isNotEmpty() && !Patterns.EMAIL_ADDRESS.matcher(it).matches()
                    errorMessage = null
                },
                label = { Text("Email") },
                placeholder = { Text("contoh@sekolah.com") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                isError = emailError,
                supportingText = {
                    if (emailError) {
                        Text("Format email tidak valid")
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                enabled = !isLoading
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password TextField
            OutlinedTextField(
                value = password,
                onValueChange = { 
                    password = it
                    errorMessage = null
                },
                label = { Text("Password") },
                placeholder = { Text("Masukkan password") },
                visualTransformation = if (passwordVisible) 
                    VisualTransformation.None 
                else 
                    PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Text(
                            text = if (passwordVisible) "👁️" else "👁",
                            fontSize = 20.sp
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                enabled = !isLoading
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Login Button
            Button(
                onClick = {
                    if (email.isNotEmpty() && password.isNotEmpty() && !emailError) {
                        Log.d("LoginActivity", "Login button clicked: $email")
                        authViewModel.login(email, password)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = !isLoading && 
                         email.isNotEmpty() && 
                         !emailError && 
                         password.isNotEmpty()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(
                        text = "Login",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Helper text
            Text(
                text = "Gunakan akun yang terdaftar di sistem",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        // Loading overlay
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }
    }
}

// Keep old LoginScreen for backward compatibility (can be removed later)
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginClick: (String, String, String) -> Unit
) {
    var selectedRole by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var emailError by remember { mutableStateOf(false) }
    var expanded by remember { mutableStateOf(false) }

    val roles = listOf("Siswa", "Kurikulum", "Kepala Sekolah", "Admin")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Logo Sekolah
        Image(
            painter = painterResource(id = R.drawable.logo_sekolah),
            contentDescription = "Logo Sekolah",
            modifier = Modifier.size(120.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Title
        Text(
            text = "Aplikasi Monitoring Kelas",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Silakan login untuk melanjutkan",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Role Spinner (Dropdown)
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded },
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = selectedRole,
                onValueChange = {},
                readOnly = true,
                label = { Text("Pilih Role") },
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(),
                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
            )

            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                roles.forEach { role ->
                    DropdownMenuItem(
                        text = { Text(role) },
                        onClick = {
                            selectedRole = role
                            expanded = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Email TextField
        OutlinedTextField(
            value = email,
            onValueChange = {
                email = it
                emailError = it.isNotEmpty() && !Patterns.EMAIL_ADDRESS.matcher(it).matches()
            },
            label = { Text("Email") },
            placeholder = { Text("contoh@email.com") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            isError = emailError,
            supportingText = {
                if (emailError) {
                    Text("Format email tidak valid")
                }
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Password TextField
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            placeholder = { Text("Masukkan password") },
            visualTransformation = if (passwordVisible) 
                VisualTransformation.None 
            else 
                PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Text(
                        text = if (passwordVisible) "👁️" else "👁",
                        fontSize = 20.sp
                    )
                }
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Login Button
        Button(
            onClick = {
                if (selectedRole.isNotEmpty() && 
                    email.isNotEmpty() && 
                    !emailError && 
                    password.isNotEmpty()) {
                    onLoginClick(selectedRole, email, password)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            enabled = selectedRole.isNotEmpty() && 
                     email.isNotEmpty() && 
                     !emailError && 
                     password.isNotEmpty()
        ) {
            Text(
                text = "Login",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}
