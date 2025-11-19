package com.komputerkit.earningapp.screens

import android.content.Context
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.komputerkit.earningapp.R
import com.komputerkit.earningapp.data.database.AppDatabase
import com.komputerkit.earningapp.data.entity.Transaction
import com.komputerkit.earningapp.data.entity.Withdrawal
import com.komputerkit.earningapp.data.repository.TransactionRepository
import com.komputerkit.earningapp.data.repository.UserRepository
import com.komputerkit.earningapp.data.repository.WithdrawalRepository
import kotlinx.coroutines.launch

class WithdrawalActivity : AppCompatActivity() {
    
    private lateinit var availableCoinsTextView: TextView
    private lateinit var amountEditText: EditText
    private lateinit var paymentMethodSpinner: Spinner
    private lateinit var accountNumberEditText: EditText
    private lateinit var withdrawButton: Button
    
    private var availableCoins = 0
    private var userId: Int = 0
    private val MINIMUM_WITHDRAWAL = 1000 // Minimum 1000 coins
    
    private lateinit var userRepository: UserRepository
    private lateinit var transactionRepository: TransactionRepository
    private lateinit var withdrawalRepository: WithdrawalRepository
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_withdrawal)
        
        // Setup action bar
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Penarikan Dana"
        
        // Get userId
        val sharedPref = getSharedPreferences("EarningQuizApp", Context.MODE_PRIVATE)
        userId = sharedPref.getInt("userId", 0)
        
        // Initialize database
        val database = AppDatabase.getDatabase(this)
        userRepository = UserRepository(database.userDao())
        transactionRepository = TransactionRepository(database.transactionDao())
        withdrawalRepository = WithdrawalRepository(database.withdrawalDao())
        
        // Initialize views
        availableCoinsTextView = findViewById(R.id.availableCoinsTextView)
        amountEditText = findViewById(R.id.amountEditText)
        paymentMethodSpinner = findViewById(R.id.paymentMethodSpinner)
        accountNumberEditText = findViewById(R.id.accountNumberEditText)
        withdrawButton = findViewById(R.id.withdrawButton)
        
        // Load user coins
        loadCoins()
        
        // Setup payment method spinner
        setupPaymentMethodSpinner()
        
        // Setup withdraw button
        withdrawButton.setOnClickListener {
            processWithdrawal()
        }
    }
    
    private fun loadCoins() {
        if (userId == 0) return
        
        lifecycleScope.launch {
            try {
                val user = userRepository.getUserById(userId)
                user?.let {
                    availableCoins = it.coins
                    runOnUiThread {
                        availableCoinsTextView.text = it.coins.toString()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private fun setupPaymentMethodSpinner() {
        val paymentMethods = arrayOf(
            "Pilih Metode Pembayaran",
            "DANA",
            "OVO",
            "GoPay",
            "ShopeePay",
            "LinkAja",
            "Bank Transfer (BCA)",
            "Bank Transfer (Mandiri)",
            "Bank Transfer (BRI)",
            "Bank Transfer (BNI)"
        )
        
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            paymentMethods
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        paymentMethodSpinner.adapter = adapter
    }
    
    private fun processWithdrawal() {
        // Get input values
        val amountStr = amountEditText.text.toString().trim()
        val paymentMethod = paymentMethodSpinner.selectedItem.toString()
        val accountNumber = accountNumberEditText.text.toString().trim()
        
        // Validation
        if (amountStr.isEmpty()) {
            amountEditText.error = "Masukkan jumlah penarikan"
            return
        }
        
        val amount = try {
            amountStr.toInt()
        } catch (e: NumberFormatException) {
            amountEditText.error = "Jumlah tidak valid"
            return
        }
        
        if (amount < MINIMUM_WITHDRAWAL) {
            amountEditText.error = "Minimum penarikan $MINIMUM_WITHDRAWAL koin"
            return
        }
        
        if (amount > availableCoins) {
            amountEditText.error = "Koin tidak mencukupi"
            return
        }
        
        if (paymentMethod == "Pilih Metode Pembayaran") {
            Toast.makeText(this, "Pilih metode pembayaran", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (accountNumber.isEmpty()) {
            accountNumberEditText.error = "Masukkan nomor akun/telepon"
            return
        }
        
        // Show confirmation dialog
        showConfirmationDialog(amount, paymentMethod, accountNumber)
    }
    
    private fun showConfirmationDialog(amount: Int, paymentMethod: String, accountNumber: String) {
        AlertDialog.Builder(this)
            .setTitle("Konfirmasi Penarikan")
            .setMessage(
                "Apakah Anda yakin ingin menarik $amount koin?\n\n" +
                        "Metode: $paymentMethod\n" +
                        "Nomor: $accountNumber\n\n" +
                        "Dana akan diproses dalam 1-3 hari kerja."
            )
            .setPositiveButton("Ya, Tarik") { _, _ ->
                performWithdrawal(amount)
            }
            .setNegativeButton("Batal", null)
            .show()
    }
    
    private fun performWithdrawal(amount: Int) {
        if (userId == 0) return
        
        lifecycleScope.launch {
            try {
                // Get current user
                val user = userRepository.getUserById(userId)
                user?.let {
                    val newBalance = it.coins - amount
                    
                    // Update coins in database
                    userRepository.updateCoins(userId, newBalance)
                    
                    // Save withdrawal record
                    val paymentMethod = paymentMethodSpinner.selectedItem.toString()
                    val accountNumber = accountNumberEditText.text.toString().trim()
                    
                    withdrawalRepository.insertWithdrawal(
                        Withdrawal(
                            userId = userId,
                            amount = amount,
                            paymentMethod = paymentMethod,
                            accountNumber = accountNumber,
                            status = "PENDING"
                        )
                    )
                    
                    // Log transaction
                    transactionRepository.insertTransaction(
                        Transaction(
                            userId = userId,
                            type = "WITHDRAWAL",
                            amount = -amount, // Negative for withdrawal
                            description = "Withdrawal via $paymentMethod: $amount coins"
                        )
                    )
                    
                    // Update UI
                    runOnUiThread {
                        availableCoins = newBalance
                        availableCoinsTextView.text = newBalance.toString()
                        
                        // Clear form
                        amountEditText.text.clear()
                        paymentMethodSpinner.setSelection(0)
                        accountNumberEditText.text.clear()
                        
                        // Show success message
                        AlertDialog.Builder(this@WithdrawalActivity)
                            .setTitle("Penarikan Berhasil! ✅")
                            .setMessage(
                                "Penarikan Anda sebesar $amount koin telah diproses.\n\n" +
                                        "Dana akan dikirim dalam 1-3 hari kerja.\n" +
                                        "Terima kasih!"
                            )
                            .setPositiveButton("OK", null)
                            .show()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                runOnUiThread {
                    Toast.makeText(
                        this@WithdrawalActivity,
                        "Error processing withdrawal: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
