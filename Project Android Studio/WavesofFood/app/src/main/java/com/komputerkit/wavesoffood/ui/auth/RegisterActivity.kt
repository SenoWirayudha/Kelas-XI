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
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.wavesoffood.MainActivity
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.databinding.ActivityRegisterBinding
import com.komputerkit.wavesoffood.model.User

class RegisterActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityRegisterBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var googleSignInClient: GoogleSignInClient
    
    companion object {
        private const val TAG = "RegisterActivity"
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
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        
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
        
        setupClickListeners()
    }
    
    private fun setupClickListeners() {
        binding.apply {
            btnRegister.setOnClickListener {
                registerWithEmail()
            }
            
            btnGoogleSignIn.setOnClickListener {
                signInWithGoogle()
            }
            
            tvLogin.setOnClickListener {
                finish() // Go back to login activity
            }
            
            // Back button in toolbar
            toolbar.setNavigationOnClickListener {
                finish()
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
                        // Create user document in Firestore (for both new and existing users from Google)
                        saveGoogleUserToFirestore(it)
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
        
        db.collection("users")
            .document(firebaseUser.uid)
            .set(user)
            .addOnSuccessListener {
                hideProgress()
                Log.d(TAG, "Google user data saved successfully")
                Toast.makeText(this, "Registration successful!", Toast.LENGTH_SHORT).show()
                
                val intent = Intent(this, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            .addOnFailureListener { e ->
                hideProgress()
                Log.w(TAG, "Error saving Google user data", e)
                showError("Registration completed but failed to save profile")
                
                // Navigate anyway
                val intent = Intent(this, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
    }

    private fun registerWithEmail() {
        val name = binding.etName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()
        
        // Clear previous errors
        binding.tilName.error = null
        binding.tilEmail.error = null
        binding.tilPassword.error = null
        binding.tilConfirmPassword.error = null
        
        // Validation
        if (name.isEmpty()) {
            binding.tilName.error = "Nama harus diisi"
            return
        }
        
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email harus diisi"
            return
        }
        
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password harus diisi"
            return
        }
        
        if (password.length < 6) {
            binding.tilPassword.error = "Password minimal 6 karakter"
            return
        }
        
        if (confirmPassword.isEmpty()) {
            binding.tilConfirmPassword.error = "Konfirmasi password harus diisi"
            return
        }
        
        if (password != confirmPassword) {
            binding.tilConfirmPassword.error = "Password tidak sama"
            return
        }
        
        showProgress()
        
        auth.createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "createUserWithEmail:success")
                    saveUserToFirestore(name, email)
                } else {
                    hideProgress()
                    Log.w(TAG, "createUserWithEmail:failure", task.exception)
                    showError("Registrasi gagal: ${task.exception?.message}")
                }
            }
    }
    
    private fun saveUserToFirestore(name: String, email: String, photoUrl: String = "") {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            hideProgress()
            showError("User creation failed")
            return
        }
        
        val user = User(
            id = currentUser.uid,
            name = name,
            email = email,
            phone = "",
            address = null,
            profileImage = photoUrl.ifEmpty { currentUser.photoUrl?.toString() ?: "" },
            isBanned = false,
            banReason = ""
        )
        
        db.collection("users")
            .document(currentUser.uid)
            .set(user)
            .addOnSuccessListener {
                hideProgress()
                Log.d(TAG, "User data berhasil disimpan")
                Toast.makeText(this, "Registrasi berhasil!", Toast.LENGTH_SHORT).show()
                
                val intent = Intent(this, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            .addOnFailureListener { e ->
                hideProgress()
                Log.w(TAG, "Error menyimpan data user", e)
                showError("Registrasi selesai tapi gagal menyimpan profil")
                
                // Navigate anyway
                val intent = Intent(this, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
    }
    
    private fun showProgress() {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnRegister.isEnabled = false
        binding.btnGoogleSignIn.isEnabled = false
    }
    
    private fun hideProgress() {
        binding.progressBar.visibility = View.GONE
        binding.btnRegister.isEnabled = true
        binding.btnGoogleSignIn.isEnabled = true
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
