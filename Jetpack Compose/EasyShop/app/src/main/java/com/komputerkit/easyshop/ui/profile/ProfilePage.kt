package com.komputerkit.easyshop.ui.profile

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Profile Screen - Halaman profil pengguna lengkap dengan:
 * 1. Pengambilan data dari Firestore (nama, email, alamat, jumlah cart)
 * 2. TextField untuk edit alamat
 * 3. Link navigasi ke Order History
 * 4. Tombol Sign Out
 */
@Composable
fun ProfilePage(
    onNavigateToOrders: () -> Unit = {},
    onLogout: () -> Unit = {}
) {
    val context = LocalContext.current
    val firestore = FirebaseFirestore.getInstance()
    val auth = FirebaseAuth.getInstance()
    val scope = rememberCoroutineScope()
    
    // State untuk data user
    var userName by remember { mutableStateOf("") }
    var userEmail by remember { mutableStateOf("") }
    var userAddress by remember { mutableStateOf("") }
    var cartItemCount by remember { mutableIntStateOf(0) }
    var isLoading by remember { mutableStateOf(true) }
    var isSavingAddress by remember { mutableStateOf(false) }
    
    // 1. PENGAMBILAN DATA dari Firestore
    LaunchedEffect(Unit) {
        isLoading = true
        try {
            val currentUser = auth.currentUser
            println("ProfilePage: Loading profile for userId: ${currentUser?.uid}")
            
            if (currentUser != null) {
                userEmail = currentUser.email ?: ""
                
                // Get user data dari collection 'users'
                val userDoc = firestore.collection("users")
                    .document(currentUser.uid)
                    .get()
                    .await()
                
                println("ProfilePage: User document exists: ${userDoc.exists()}")
                println("ProfilePage: User data: ${userDoc.data}")
                
                userDoc.data?.let { data ->
                    userName = data["name"] as? String ?: ""
                    userAddress = data["address"] as? String ?: ""
                    println("ProfilePage: Loaded - Name: $userName, Address: $userAddress")
                }
                
                // Get cart item count
                val cartSnapshot = firestore.collection("users")
                    .document(currentUser.uid)
                    .collection("cart")
                    .get()
                    .await()
                
                cartItemCount = cartSnapshot.documents.size
                println("ProfilePage: Cart items: $cartItemCount")
            }
        } catch (e: Exception) {
            println("ProfilePage ERROR: ${e.message}")
            e.printStackTrace()
            Toast.makeText(
                context,
                "Failed to load profile: ${e.message}",
                Toast.LENGTH_SHORT
            ).show()
        } finally {
            isLoading = false
        }
    }
    
    // Function untuk update address di Firestore
    fun updateAddress() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Toast.makeText(context, "User not logged in", Toast.LENGTH_SHORT).show()
            return
        }
        
        println("ProfilePage: Updating address to: $userAddress")
        isSavingAddress = true
        scope.launch {
            try {
                // Update field 'address' di Firestore
                firestore.collection("users")
                    .document(currentUser.uid)
                    .update("address", userAddress)
                    .await()
                
                println("ProfilePage: Address updated successfully")
                
                // Tampilkan toast success
                Toast.makeText(
                    context,
                    "Address updated successfully",
                    Toast.LENGTH_SHORT
                ).show()
            } catch (e: Exception) {
                println("ProfilePage ERROR updating address: ${e.message}")
                e.printStackTrace()
                Toast.makeText(
                    context,
                    "Failed to update address: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                isSavingAddress = false
            }
        }
    }
    
    // 2. TAMPILAN UTAMA dengan Column
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Spacer(modifier = Modifier.height(32.dp))
            
            // Image - Placeholder untuk foto profil
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Person,
                    contentDescription = "Profile Photo",
                    modifier = Modifier.size(80.dp),
                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Text untuk nama pengguna
            Text(
                text = userName.ifEmpty { "User" },
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Text untuk email
            Text(
                text = userEmail,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Card untuk Cart Item Count
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Items in Cart",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "$cartItemCount",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // 3. BIDANG ALAMAT YANG DAPAT DIEDIT
            OutlinedTextField(
                value = userAddress,
                onValueChange = { userAddress = it },
                label = { Text("Shipping Address") },
                placeholder = { Text("Enter your shipping address") },
                modifier = Modifier.fillMaxWidth(),
                // ImeAction.Done
                keyboardOptions = KeyboardOptions(
                    imeAction = ImeAction.Done
                ),
                // onDone action untuk update Firestore
                keyboardActions = KeyboardActions(
                    onDone = {
                        updateAddress()
                    }
                ),
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = "Address"
                    )
                },
                trailingIcon = {
                    if (isSavingAddress) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp
                        )
                    }
                },
                enabled = !isSavingAddress,
                maxLines = 3,
                shape = RoundedCornerShape(12.dp)
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // 4. TAUTAN NAVIGASI - View My Orders
            TextButton(
                onClick = onNavigateToOrders,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Filled.ShoppingCart,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "View My Orders",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.weight(1f))
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null
                )
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // 5. TOMBOL KELUAR (Sign Out)
            Button(
                onClick = {
                    // Firebase sign out
                    auth.signOut()
                    // Navigate ke login dan clear back stack
                    onLogout()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Sign Out",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // App Version
            Text(
                text = "EasyShop v1.0",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
