package com.komputerkit.easyshop.ui.auth

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.ClickableText
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.komputerkit.easyshop.ui.theme.EasyShopTheme
import com.komputerkit.easyshop.viewmodel.AuthViewModel

/**
 * Layar Signup dengan desain Material 3 yang bersih dan modern
 * Terintegrasi dengan AuthViewModel untuk Firebase Authentication dan Firestore
 *
 * @param authViewModel ViewModel untuk menangani autentikasi
 * @param onNavigateToLogin Callback untuk navigasi ke layar login
 * @param onNavigateToHome Callback untuk navigasi ke layar home setelah signup berhasil
 */
@Composable
fun SignupScreen(
    authViewModel: AuthViewModel = viewModel(),
    onNavigateToLogin: () -> Unit = {},
    onNavigateToHome: () -> Unit = {}
) {
    // Context untuk menampilkan Toast
    val context = LocalContext.current
    
    // State management untuk input fields
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    var isLoading by remember { mutableStateOf(false) }

    // Validasi form
    val isFormValid = fullName.isNotBlank() && 
                     email.isNotBlank() && 
                     password.isNotBlank() && 
                     confirmPassword.isNotBlank() && 
                     password == confirmPassword &&
                     password.length >= 6

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Text(
                    text = "Buat Akun Baru",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                
                Text(
                    text = "Bergabunglah dengan EasyShop dan mulai berbelanja",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Full Name Field
                OutlinedTextField(
                    value = fullName,
                    onValueChange = { fullName = it },
                    label = { Text("Nama Lengkap") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Person Icon"
                        )
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                )

                // Email Field
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Email,
                            contentDescription = "Email Icon"
                        )
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading,
                    isError = email.isNotBlank() && !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches(),
                    supportingText = {
                        if (email.isNotBlank() && !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                            Text(
                                text = "Format email tidak valid",
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                )

                // Password Field
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Kata Sandi") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Password Icon"
                        )
                    },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading,
                    isError = password.isNotBlank() && password.length < 6,
                    supportingText = {
                        if (password.isNotBlank() && password.length < 6) {
                            Text(
                                text = "Password minimal 6 karakter",
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                )

                // Confirm Password Field
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Konfirmasi Kata Sandi") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Confirm Password Icon"
                        )
                    },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading,
                    isError = confirmPassword.isNotBlank() && password != confirmPassword,
                    supportingText = {
                        if (confirmPassword.isNotBlank() && password != confirmPassword) {
                            Text(
                                text = "Password tidak cocok",
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Signup Button
                Button(
                    onClick = {
                        if (isFormValid) {
                            // 1. Set isLoading ke true
                            isLoading = true
                            
                            // 2. Panggil authViewModel.signUp()
                            authViewModel.signUp(email, password, fullName) { success, errorMessage ->
                                // 3. Di callback onResult:
                                // Set isLoading ke false
                                isLoading = false
                                
                                if (success) {
                                    // Jika sukses, navigasi ke home
                                    Toast.makeText(
                                        context,
                                        "Pendaftaran berhasil! Selamat datang, $fullName",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                    onNavigateToHome()
                                } else {
                                    // Jika gagal, tampilkan pesan error menggunakan Toast
                                    Toast.makeText(
                                        context,
                                        errorMessage ?: "Pendaftaran gagal",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                            }
                        } else {
                            // Tampilkan pesan validasi
                            val message = when {
                                fullName.isBlank() -> "Nama lengkap harus diisi"
                                email.isBlank() -> "Email harus diisi"
                                !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> 
                                    "Format email tidak valid"
                                password.isBlank() -> "Password harus diisi"
                                password.length < 6 -> "Password minimal 6 karakter"
                                confirmPassword.isBlank() -> "Konfirmasi password harus diisi"
                                password != confirmPassword -> "Password tidak cocok"
                                else -> "Mohon lengkapi semua field"
                            }
                            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    enabled = !isLoading && isFormValid
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.height(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text(
                            text = "Daftar",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Login navigation text
                val annotatedText = buildAnnotatedString {
                    append("Sudah punya akun? ")
                    pushStringAnnotation(tag = "login", annotation = "login")
                    withStyle(
                        style = SpanStyle(
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Medium
                        )
                    ) {
                        append("Masuk di sini")
                    }
                    pop()
                }

                ClickableText(
                    text = annotatedText,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    ),
                    onClick = { offset ->
                        annotatedText.getStringAnnotations(
                            tag = "login",
                            start = offset,
                            end = offset
                        ).firstOrNull()?.let {
                            onNavigateToLogin()
                        }
                    }
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun SignupScreenPreview() {
    EasyShopTheme {
        SignupScreen()
    }
}