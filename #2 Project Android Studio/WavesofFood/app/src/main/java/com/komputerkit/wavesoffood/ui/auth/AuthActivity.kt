package com.komputerkit.wavesoffood.ui.auth

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.MainActivity
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.ActivityAuthBinding
import com.komputerkit.wavesoffood.model.User

class AuthActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityAuthBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var firestore: FirebaseFirestore
    private lateinit var googleSignInClient: GoogleSignInClient
    
    companion object {
        private const val TAG = "AuthActivity"
    }
    
    // Google Sign-In result launcher
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)!!
            Log.d(TAG, "firebaseAuthWithGoogle:" + account.id)
            firebaseAuthWithGoogle(account.idToken!!)
        } catch (e: ApiException) {
            Log.w(TAG, "Google sign in failed with code: ${e.statusCode}", e)
            hideProgress()
            
            val errorMessage = when (e.statusCode) {
                10 -> "Google Sign-In configuration error. Please check Firebase setup."
                12501 -> "Google Sign-In was cancelled."
                7 -> "Network error. Please check your internet connection."
                else -> "Google sign in failed: ${e.message} (Code: ${e.statusCode})"
            }
            showError(errorMessage)
            
            // Additional logging for debugging
            Log.e(TAG, "Google Sign-In Error Details:")
            Log.e(TAG, "Status Code: ${e.statusCode}")
            Log.e(TAG, "Status Message: ${e.status}")
            Log.e(TAG, "Local Message: ${e.localizedMessage}")
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAuthBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()
        firestore = FirebaseFirestore.getInstance()
        
        // Configure Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .requestProfile()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)
        
        // Clear any previous Google Sign-In state
        googleSignInClient.signOut()
        
        Log.d(TAG, "Google Sign-In configured with client ID: ${getString(R.string.default_web_client_id)}")
        
        // Check if user is already signed in
        if (auth.currentUser != null) {
            checkUserBanStatus()
            return
        }
        
        setupClickListeners()
    }
    
    private fun setupClickListeners() {
        binding.apply {
            btnLogin.setOnClickListener {
                loginWithEmail()
            }
            
            btnGoogleSignIn.setOnClickListener {
                signInWithGoogle()
            }
            
            tvRegister.setOnClickListener {
                Log.d(TAG, "Register button clicked")
                val intent = Intent(this@AuthActivity, RegisterActivity::class.java)
                startActivity(intent)
            }
        }
    }
    
    private fun loginWithEmail() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email is required"
            return
        }
        
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password is required"
            return
        }
        
        showProgress()
        
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                hideProgress()
                if (task.isSuccessful) {
                    Log.d(TAG, "signInWithEmail:success")
                    // Check if user is banned before proceeding
                    checkUserBanStatus()
                } else {
                    Log.w(TAG, "signInWithEmail:failure", task.exception)
                    showError("Authentication failed: ${task.exception?.message}")
                }
            }
    }
    
    private fun signInWithGoogle() {
        Log.d(TAG, "Starting Google Sign-In...")
        
        // Check if Google Play Services is available
        val googleApiAvailability = com.google.android.gms.common.GoogleApiAvailability.getInstance()
        val resultCode = googleApiAvailability.isGooglePlayServicesAvailable(this)
        
        if (resultCode != com.google.android.gms.common.ConnectionResult.SUCCESS) {
            Log.e(TAG, "Google Play Services not available. Result code: $resultCode")
            showError("Google Play Services is required for Google Sign-In")
            return
        }
        
        showProgress()
        
        // Sign out any existing account first
        googleSignInClient.signOut().addOnCompleteListener {
            Log.d(TAG, "Previous sign-out completed, starting new sign-in...")
            val signInIntent = googleSignInClient.signInIntent
            googleSignInLauncher.launch(signInIntent)
        }
    }
    
    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "signInWithCredential:success")
                    val user = auth.currentUser
                    user?.let {
                        // Check if this is a new user
                        if (task.result?.additionalUserInfo?.isNewUser == true) {
                            // Create user document in Firestore for new users
                            saveGoogleUserToFirestore(it)
                        } else {
                            // Existing user - check ban status
                            checkUserBanStatus()
                        }
                    }
                } else {
                    Log.w(TAG, "signInWithCredential:failure", task.exception)
                    hideProgress()
                    showError("Authentication failed: ${task.exception?.message}")
                }
            }
    }
    
    private fun saveGoogleUserToFirestore(firebaseUser: com.google.firebase.auth.FirebaseUser) {
        val user = User(
            id = firebaseUser.uid,
            name = firebaseUser.displayName ?: "",
            email = firebaseUser.email ?: "",
            phone = "",
            address = null,
            profileImage = firebaseUser.photoUrl?.toString() ?: "",
            isBanned = false,
            banReason = ""
        )
        
        firestore.collection("users")
            .document(firebaseUser.uid)
            .set(user)
            .addOnSuccessListener {
                Log.d(TAG, "Google user data saved successfully")
                checkUserBanStatus()
            }
            .addOnFailureListener { e ->
                Log.w(TAG, "Error saving Google user data", e)
                // Still proceed to check ban status even if save fails
                checkUserBanStatus()
            }
    }
    
    private fun registerWithEmail() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        
        Log.d(TAG, "Register function called with email: $email")
        
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email is required"
            return
        }
        
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password is required"
            return
        }
        
        if (password.length < 6) {
            binding.tilPassword.error = "Password should be at least 6 characters"
            return
        }
        
        showProgress()
        
        auth.createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                hideProgress()
                if (task.isSuccessful) {
                    Log.d(TAG, "createUserWithEmail:success")
                    Toast.makeText(this, "Registration successful!", Toast.LENGTH_SHORT).show()
                    navigateToMain()
                } else {
                    Log.w(TAG, "createUserWithEmail:failure", task.exception)
                    showError("Registration failed: ${task.exception?.message}")
                }
            }
    }
    
    private fun checkUserBanStatus() {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            Log.e(TAG, "No current user found")
            return
        }
        
        showProgress()
        
        firestore.collection("users")
            .document(currentUser.uid)
            .get()
            .addOnSuccessListener { document ->
                hideProgress()
                
                if (document.exists()) {
                    val isBanned = document.getBoolean("isBanned") ?: false
                    val banReason = document.getString("banReason") ?: "Anda melanggar peraturan kami"
                    
                    if (isBanned) {
                        // User is banned - sign out and show ban message
                        auth.signOut()
                        showBanDialog(banReason)
                    } else {
                        // User is not banned - proceed to main activity
                        navigateToMain()
                    }
                } else {
                    // User document doesn't exist - proceed to main activity
                    Log.w(TAG, "User document not found in Firestore")
                    navigateToMain()
                }
            }
            .addOnFailureListener { exception ->
                hideProgress()
                Log.e(TAG, "Error checking ban status: ${exception.message}")
                // On error, proceed to main activity (fail-safe)
                navigateToMain()
            }
    }
    
    private fun showBanDialog(banReason: String) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Akun Diblokir")
            .setMessage("Akun Anda telah diblokir.\n\nAlasan: $banReason\n\nSilakan hubungi customer service untuk informasi lebih lanjut.")
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
                // Clear any login form data
                binding.etEmail.text?.clear()
                binding.etPassword.text?.clear()
            }
            .setCancelable(false)
            .show()
    }
    
    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun showProgress() {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false
        binding.btnGoogleSignIn.isEnabled = false
    }
    
    private fun hideProgress() {
        binding.progressBar.visibility = View.GONE
        binding.btnLogin.isEnabled = true
        binding.btnGoogleSignIn.isEnabled = true
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
}
