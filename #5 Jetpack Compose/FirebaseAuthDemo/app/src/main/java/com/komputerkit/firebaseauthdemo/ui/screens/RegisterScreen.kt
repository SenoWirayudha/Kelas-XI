package com.komputerkit.firebaseauthdemo.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.ClickableText
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.firebaseauthdemo.ui.auth.AuthViewModel

@Composable
fun RegisterScreen(
    authViewModel: AuthViewModel,
    onNavigateToLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    
    // Validasi lokal untuk UI feedback
    val isEmailValid = email.isNotBlank() && android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    val isPasswordValid = password.length >= 6
    val isPasswordMatch = password == confirmPassword && confirmPassword.isNotEmpty()
    val canRegister = isEmailValid && isPasswordValid && isPasswordMatch
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Back button and Title
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onNavigateToLogin,
                modifier = Modifier.padding(end = 16.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Kembali"
                )
            }
            
            Text(
                text = "Daftar Akun Baru",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )
        }
        
        // Email Input
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            placeholder = { Text("contoh@email.com") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            isError = email.isNotBlank() && !isEmailValid,
            supportingText = {
                if (email.isNotBlank() && !isEmailValid) {
                    Text("Format email tidak valid", color = MaterialTheme.colorScheme.error)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        )
        
        // Password Input
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            placeholder = { Text("Minimal 6 karakter") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            isError = password.isNotBlank() && !isPasswordValid,
            supportingText = {
                if (password.isNotBlank() && !isPasswordValid) {
                    Text("Password minimal 6 karakter", color = MaterialTheme.colorScheme.error)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        )
        
        // Confirm Password Input
        OutlinedTextField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            label = { Text("Konfirmasi Password") },
            placeholder = { Text("Ulangi password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            isError = confirmPassword.isNotBlank() && !isPasswordMatch,
            supportingText = {
                if (confirmPassword.isNotBlank() && !isPasswordMatch) {
                    Text("Password tidak sama", color = MaterialTheme.colorScheme.error)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        )
        
        // Register Button
        Button(
            onClick = {
                authViewModel.signup(email, password)
            },
            enabled = canRegister,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = "Daftar Sekarang",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )
        }
        
        // Login Link
        val annotatedString = buildAnnotatedString {
            withStyle(style = SpanStyle(color = MaterialTheme.colorScheme.onSurface)) {
                append("Sudah punya akun? ")
            }
            pushStringAnnotation(
                tag = "LOGIN",
                annotation = "login"
            )
            withStyle(
                style = SpanStyle(
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium
                )
            ) {
                append("Login")
            }
            pop()
        }
        
        ClickableText(
            text = annotatedString,
            onClick = { offset ->
                annotatedString.getStringAnnotations(
                    tag = "LOGIN",
                    start = offset,
                    end = offset
                ).firstOrNull()?.let {
                    onNavigateToLogin()
                }
            }
        )
    }
}