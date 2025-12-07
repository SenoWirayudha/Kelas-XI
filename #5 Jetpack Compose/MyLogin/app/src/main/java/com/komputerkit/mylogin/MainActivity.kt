package com.komputerkit.mylogin

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.mylogin.ui.theme.MyLoginTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyLoginTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    LoginScreen(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun LoginScreen(modifier: Modifier = Modifier) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Logo image
        Image(
            painter = painterResource(id = R.drawable.a),
            contentDescription = "Logo",
            modifier = Modifier.size(200.dp)
        )
        
        // Welcome Back text
        Text(
            text = "Welcome Back",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(4.dp))
        
        // Login to your account text
        Text(text = "Login to your account")
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Email input field
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email address") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Password input field
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Login button
        Button(
            onClick = {
                Log.d("LoginScreen", "Email: $email")
                Log.d("LoginScreen", "Password: $password")
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Login")
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Forgot password button
        TextButton(onClick = { }) {
            Text("Forgot Password")
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Or sign in with text
        Text("Or sign in with")
        
        // Social media icons row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 40.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            // Facebook icon
            Image(
                painter = painterResource(id = R.drawable.ic_facebook),
                contentDescription = "Facebook",
                modifier = Modifier
                    .size(60.dp)
                    .clickable {
                        Log.d("LoginScreen", "Facebook clicked")
                    }
            )
            
            // Google icon
            Image(
                painter = painterResource(id = R.drawable.ic_google),
                contentDescription = "Google",
                modifier = Modifier
                    .size(60.dp)
                    .clickable {
                        Log.d("LoginScreen", "Google clicked")
                    }
            )
            
            // Twitter icon
            Image(
                painter = painterResource(id = R.drawable.ic_twitter),
                contentDescription = "Twitter",
                modifier = Modifier
                    .size(60.dp)
                    .clickable {
                        Log.d("LoginScreen", "Twitter clicked")
                    }
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    MyLoginTheme {
        LoginScreen()
    }
}