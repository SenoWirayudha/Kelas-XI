package com.komputerkit.moview.ui.auth

import android.content.Context
import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentSignUpBinding
import com.komputerkit.moview.data.repository.AuthRepository
import kotlinx.coroutines.launch

class SignUpFragment : Fragment() {

    private var _binding: FragmentSignUpBinding? = null
    private val binding get() = _binding!!
    
    private var isPasswordVisible = false
    private val authRepository = AuthRepository()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSignUpBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupClickListeners()
        setupValidation()
    }
    
    private fun setupClickListeners() {
        binding.btnTogglePassword.setOnClickListener {
            togglePasswordVisibility()
        }
        
        binding.btnSignUp.setOnClickListener {
            performSignUp()
        }
        
        binding.tvLogin.setOnClickListener {
            findNavController().popBackStack()
        }
    }
    
    private fun setupValidation() {
        binding.etUsername.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) {
                val username = binding.etUsername.text.toString()
                if (isValidUsername(username)) {
                    binding.ivUsernameCheck.visibility = View.VISIBLE
                } else {
                    binding.ivUsernameCheck.visibility = View.GONE
                }
            }
        }
        
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
    
    private fun isValidUsername(username: String): Boolean {
        return username.length >= 3
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
    
    private fun performSignUp() {
        val username = binding.etUsername.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()
        
        // Validate inputs
        if (username.isEmpty()) {
            Toast.makeText(requireContext(), "Please enter username", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (!isValidUsername(username)) {
            Toast.makeText(requireContext(), "Username must be at least 3 characters", Toast.LENGTH_SHORT).show()
            return
        }
        
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
        
        if (password.length < 6) {
            Toast.makeText(requireContext(), "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Show loading state
        showLoading(true)
        
        // Perform API registration
        lifecycleScope.launch {
            val result = authRepository.register(username, email, password)
            
            result.onSuccess { loginData ->
                // Save login state
                saveLoginState(loginData.email, loginData.username, loginData.token, loginData.userId)
                
                showLoading(false)
                Toast.makeText(requireContext(), "Welcome to Moview, ${loginData.username}!", Toast.LENGTH_SHORT).show()
                
                // Navigate to home
                findNavController().navigate(R.id.action_signUp_to_home)
            }.onFailure { error ->
                showLoading(false)
                val errorMessage = when {
                    error.message?.contains("Email already registered") == true -> "Email already registered"
                    error.message?.contains("Username already taken") == true -> "Username already taken"
                    error.message?.contains("Validation failed") == true -> "Please check your inputs"
                    else -> "Registration failed. Please try again."
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
            binding.btnSignUp.text = ""
            binding.progressBar.visibility = View.VISIBLE
            binding.tvSignupStatus.visibility = View.VISIBLE
            binding.btnSignUp.isEnabled = false
        } else {
            binding.btnSignUp.text = "Sign Up"
            binding.progressBar.visibility = View.GONE
            binding.tvSignupStatus.visibility = View.GONE
            binding.btnSignUp.isEnabled = true
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
