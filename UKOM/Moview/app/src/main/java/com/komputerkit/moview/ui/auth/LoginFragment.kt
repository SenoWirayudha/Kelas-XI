package com.komputerkit.moview.ui.auth

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.text.InputType
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentLoginBinding
import com.komputerkit.moview.data.repository.AuthRepository
import kotlinx.coroutines.launch

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!

    private var isPasswordVisible = false
    private val authRepository = AuthRepository()

    private lateinit var googleSignInClient: GoogleSignInClient

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                val email = account.email ?: ""
                val displayName = account.displayName ?: account.givenName ?: "User"
                val googleId = account.id ?: ""

                if (email.isBlank() || googleId.isBlank()) {
                    showGoogleLoading(false)
                    Toast.makeText(requireContext(), "Gagal mendapatkan data akun Google", Toast.LENGTH_SHORT).show()
                    return@registerForActivityResult
                }

                sendGoogleLoginToBackend(email, displayName, googleId)
            } catch (e: ApiException) {
                showGoogleLoading(false)
                Log.e("LoginFragment", "Google sign in failed: ${e.statusCode}", e)
                val msg = when (e.statusCode) {
                    10 -> "Konfigurasi Google Sign-In belum lengkap (code 10)"
                    12501 -> "Login dibatalkan"
                    else -> "Google Sign-In gagal (code ${e.statusCode})"
                }
                Toast.makeText(requireContext(), msg, Toast.LENGTH_LONG).show()
            }
        } else {
            showGoogleLoading(false)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupGoogleSignIn()
        setupClickListeners()
        setupEmailValidation()
    }

    private fun setupGoogleSignIn() {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .requestId()
            .build()
        googleSignInClient = GoogleSignIn.getClient(requireActivity(), gso)
    }

    private fun setupClickListeners() {
        binding.btnTogglePassword.setOnClickListener {
            togglePasswordVisibility()
        }

        binding.btnLogin.setOnClickListener {
            performLogin()
        }

        binding.btnGoogleSignIn.setOnClickListener {
            performGoogleSignIn()
        }

        binding.tvSignUp.setOnClickListener {
            findNavController().navigate(R.id.action_login_to_signUp)
        }
    }

    private fun performGoogleSignIn() {
        showGoogleLoading(true)
        googleSignInClient.signOut().addOnCompleteListener {
            googleSignInLauncher.launch(googleSignInClient.signInIntent)
        }
    }

    private fun sendGoogleLoginToBackend(email: String, displayName: String, googleId: String) {
        lifecycleScope.launch {
            val result = authRepository.googleLogin(email, displayName, googleId)
            result.onSuccess { loginData ->
                saveLoginState(loginData.email, loginData.username, loginData.token, loginData.userId)
                showGoogleLoading(false)
                Toast.makeText(requireContext(), "Selamat datang, ${loginData.username}!", Toast.LENGTH_SHORT).show()
                findNavController().navigate(R.id.action_login_to_home)
            }.onFailure { error ->
                showGoogleLoading(false)
                Toast.makeText(requireContext(), error.message ?: "Google login gagal", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showGoogleLoading(isLoading: Boolean) {
        binding.btnGoogleSignIn.isEnabled = !isLoading
        binding.btnGoogleSignIn.text = if (isLoading) "Menghubungkan..." else "Continue with Google"
    }
    
    private fun setupEmailValidation() {
        binding.etEmail.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) {
                val email = binding.etEmail.text.toString()
                if (isValidEmail(email)) {
                    binding.ivEmailCheck.visibility = View.VISIBLE
                } else {
                    binding.ivEmailCheck.visibility = View.GONE
                }
            }
        }
    }
    
    private fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
    
    private fun togglePasswordVisibility() {
        isPasswordVisible = !isPasswordVisible
        if (isPasswordVisible) {
            binding.etPassword.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            binding.btnTogglePassword.setImageResource(R.drawable.ic_visibility)
        } else {
            binding.etPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            binding.btnTogglePassword.setImageResource(R.drawable.ic_visibility_off)
        }
        // Move cursor to end
        binding.etPassword.setSelection(binding.etPassword.text.length)
    }
    
    private fun performLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()
        
        // Validate inputs
        if (email.isEmpty()) {
            Toast.makeText(requireContext(), "Please enter email", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (!isValidEmail(email)) {
            Toast.makeText(requireContext(), "Please enter valid email", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (password.isEmpty()) {
            Toast.makeText(requireContext(), "Please enter password", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Show loading state
        showLoading(true)
        
        // Perform API login
        lifecycleScope.launch {
            val result = authRepository.login(email, password)
            
            result.onSuccess { loginData ->
                // Save login state
                saveLoginState(loginData.email, loginData.username, loginData.token, loginData.userId)
                
                showLoading(false)
                Toast.makeText(requireContext(), "Welcome, ${loginData.username}!", Toast.LENGTH_SHORT).show()
                
                // Navigate to home
                findNavController().navigate(R.id.action_login_to_home)
            }.onFailure { error ->
                showLoading(false)
                val errorMessage = when {
                    error.message?.contains("Invalid email or password") == true -> "Invalid email or password"
                    error.message?.contains("banned") == true -> "Your account has been banned"
                    error.message?.contains("suspended") == true -> "Your account has been suspended"
                    else -> "Login failed. Please try again."
                }
                Toast.makeText(requireContext(), errorMessage, Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun saveLoginState(email: String, username: String, token: String, userId: Int) {
        val sharedPrefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        sharedPrefs.edit().apply {
            putBoolean("isLoggedIn", true)
            putString("userEmail", email)
            putString("username", username)
            putString("authToken", token)
            putInt("userId", userId)
            apply()
        }
    }
    
    private fun showLoading(isLoading: Boolean) {
        if (isLoading) {
            binding.btnLogin.text = ""
            binding.progressBar.visibility = View.VISIBLE
            binding.tvLoginStatus.visibility = View.VISIBLE
            binding.btnLogin.isEnabled = false
        } else {
            binding.btnLogin.text = "Log In"
            binding.progressBar.visibility = View.GONE
            binding.tvLoginStatus.visibility = View.GONE
            binding.btnLogin.isEnabled = true
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
