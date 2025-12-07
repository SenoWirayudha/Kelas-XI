package com.komputerkit.easyshop.ui.checkout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.easyshop.repository.OrderRepository
import com.komputerkit.easyshop.viewmodel.CartViewModel
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Layar Checkout dengan ringkasan pesanan dan ringkasan harga
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    onBackClick: () -> Unit,
    onCheckoutSuccess: () -> Unit = {},
    cartViewModel: CartViewModel = viewModel()
) {
    val cartItems by cartViewModel.cartItems.collectAsState()
    val totalAmount by cartViewModel.totalAmount.collectAsState()
    val scope = rememberCoroutineScope()
    
    // State untuk user address
    var userAddress by remember { mutableStateOf("") }
    var isLoadingAddress by remember { mutableStateOf(true) }
    
    // State untuk payment processing
    var isProcessing by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var orderId by remember { mutableStateOf("") }
    var showErrorDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    
    // Load user address dari Firestore
    LaunchedEffect(Unit) {
        isLoadingAddress = true
        try {
            val currentUser = FirebaseAuth.getInstance().currentUser
            if (currentUser != null) {
                val userDoc = FirebaseFirestore.getInstance()
                    .collection("users")
                    .document(currentUser.uid)
                    .get()
                    .await()
                
                userAddress = userDoc.data?.get("address") as? String ?: ""
                println("CheckoutScreen: Loaded address: $userAddress")
            }
        } catch (e: Exception) {
            println("CheckoutScreen ERROR loading address: ${e.message}")
            e.printStackTrace()
        } finally {
            isLoadingAddress = false
        }
    }
    
    // Dialog Success
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { /* Dialog tidak bisa dismiss tanpa klik OK */ },
            title = {
                Text(
                    text = "Pembayaran Berhasil",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = "Terima kasih, pesanan Anda telah ditempatkan.\nNomor Order: $orderId",
                    style = MaterialTheme.typography.bodyLarge
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showSuccessDialog = false
                        onCheckoutSuccess() // Navigate back to Home
                    }
                ) {
                    Text("OK", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
    
    // Dialog Error
    if (showErrorDialog) {
        AlertDialog(
            onDismissRequest = { showErrorDialog = false },
            title = {
                Text(
                    text = "Pembayaran Gagal",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = errorMessage,
                    style = MaterialTheme.typography.bodyLarge
                )
            },
            confirmButton = {
                TextButton(onClick = { showErrorDialog = false }) {
                    Text("OK", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
    
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Checkout",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick, enabled = !isProcessing) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali"
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {
            // Shipping Address
            if (isLoadingAddress) {
                CircularProgressIndicator(
                    modifier = Modifier.padding(16.dp)
                )
            } else {
                ShippingAddressCard(address = userAddress)
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Ringkasan Pesanan
            Text(
                text = "Ringkasan Pesanan",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(16.dp)
            )
            
            // Daftar produk yang dibeli
            cartItems.forEach { cartItem ->
                CheckoutProductItem(cartItem = cartItem)
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Ringkasan Harga dengan diskon dan pajak
            CheckoutPriceSummary(subtotal = totalAmount.toFloat())
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Tombol Bayar
            Button(
                onClick = {
                    // Validasi address
                    if (userAddress.isBlank()) {
                        errorMessage = "Alamat pengiriman tidak boleh kosong. Silakan atur alamat di halaman Profile."
                        showErrorDialog = true
                        return@Button
                    }
                    
                    // Simulasi payment dengan Razorpay
                    // Dalam implementasi nyata, ini akan memanggil Razorpay SDK
                    // dan menunggu callback onPaymentSuccess
                    
                    isProcessing = true
                    scope.launch {
                        try {
                            // SIMULASI: Dalam kasus nyata, ini dipanggil dari onPaymentSuccess callback
                            // onPaymentSuccess { paymentId, orderId ->
                            
                            // Hitung total dengan diskon dan pajak
                            val subtotal = totalAmount
                            val discountPercentage = 10f
                            val taxPercentage = 13f
                            val discountAmount = subtotal * (discountPercentage / 100f)
                            val taxAmount = subtotal * (taxPercentage / 100f)
                            val finalTotal = subtotal - discountAmount + taxAmount
                            
                            println("CheckoutScreen: Creating order with address: $userAddress")
                            
                            // Panggil fungsi completeOrderAndClearCart
                            val result = OrderRepository.completeOrderAndClearCart(
                                cartItems = cartItems,
                                address = userAddress,
                                totalAmount = finalTotal.toDouble()
                            )
                            
                            isProcessing = false
                            
                            if (result.first) {
                                // Berhasil - reload cart dari Firestore
                                cartViewModel.loadCart()
                                orderId = result.second
                                showSuccessDialog = true
                            } else {
                                // Gagal
                                errorMessage = result.second
                                showErrorDialog = true
                            }
                            
                            // }
                            
                        } catch (e: Exception) {
                            isProcessing = false
                            errorMessage = "Terjadi kesalahan: ${e.message}"
                            showErrorDialog = true
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                ),
                shape = RoundedCornerShape(12.dp),
                enabled = cartItems.isNotEmpty() && !isProcessing
            ) {
                if (isProcessing) {
                    CircularProgressIndicator(
                        modifier = Modifier.padding(end = 8.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                }
                Text(
                    text = if (isProcessing) "Memproses..." else "Bayar Sekarang",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

/**
 * Composable untuk menampilkan alamat pengiriman
 */
@Composable
fun ShippingAddressCard(address: String) {
    androidx.compose.material3.Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = "Location",
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Shipping Address",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            if (address.isBlank()) {
                Text(
                    text = "Alamat belum diatur. Silakan atur di halaman Profile.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
            } else {
                Text(
                    text = address,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
