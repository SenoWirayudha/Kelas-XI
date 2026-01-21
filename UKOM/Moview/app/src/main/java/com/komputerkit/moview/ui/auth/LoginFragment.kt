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
import com.komputerkit.moview.databinding.FragmentLoginBinding
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!
    
    private var isPasswordVisible = false

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
        
        setupClickListeners()
        setupEmailValidation()
    }
    
    private fun setupClickListeners() {
        binding.btnTogglePassword.setOnClickListener {
            togglePasswordVisibility()
        }
        
        binding.btnLogin.setOnClickListener {
            performLogin()
        }
        
        binding.tvSignUp.setOnClickListener {
            Toast.makeText(requireContext(), "Sign Up - Coming Soon", Toast.LENGTH_SHORT).show()
        }
        
        binding.tvForgotPassword.setOnClickListener {
            Toast.makeText(requireContext(), "Forgot Password - Coming Soon", Toast.LENGTH_SHORT).show()
        }
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
        
        // Simulate login process
        lifecycleScope.launch {
            delay(2000) // Simulate network delay
            
            // Check dummy credentials
            if (authenticateUser(email, password)) {
                // Save login state
                saveLoginState(email)
                
                showLoading(false)
                Toast.makeText(requireContext(), "Login successful!", Toast.LENGTH_SHORT).show()
                
                // Navigate to home
                findNavController().navigate(R.id.action_login_to_home)
            } else {
                showLoading(false)
                Toast.makeText(requireContext(), "Invalid email or password", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun authenticateUser(email: String, password: String): Boolean {
        // Dummy credentials
        val validCredentials = mapOf(
            "user@moview.com" to "password123",
            "admin@moview.com" to "admin123",
            "test@moview.com" to "test123"
        )
        
        return validCredentials[email] == password
    }
    
    private fun saveLoginState(email: String) {
        val sharedPrefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        sharedPrefs.edit().apply {
            putBoolean("isLoggedIn", true)
            putString("userEmail", email)
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
