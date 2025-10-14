package com.komputerkit.blogapp.ui

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.komputerkit.blogapp.R
import com.komputerkit.blogapp.databinding.FragmentRegisterBinding
import com.komputerkit.blogapp.viewmodel.AuthViewModel

class RegisterFragment : Fragment() {

    private var _binding: FragmentRegisterBinding? = null
    private val binding get() = _binding!!
    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentRegisterBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupClickListeners()
        observeViewModel()
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener {
            performRegister()
        }

        binding.tvLoginLink.setOnClickListener {
            findNavController().navigate(R.id.action_register_to_login)
        }
    }

    private fun performRegister() {
        val displayName = binding.etDisplayName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()

        // Clear previous errors
        binding.tilDisplayName.error = null
        binding.tilEmail.error = null
        binding.tilPassword.error = null
        binding.tilConfirmPassword.error = null

        // Validation
        if (displayName.isEmpty()) {
            binding.tilDisplayName.error = "Nama lengkap tidak boleh kosong"
            return
        }
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email tidak boleh kosong"
            return
        }
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password tidak boleh kosong"
            return
        }
        if (password.length < 6) {
            binding.tilPassword.error = "Password minimal 6 karakter"
            return
        }
        if (password != confirmPassword) {
            binding.tilConfirmPassword.error = "Password tidak cocok"
            return
        }

        Log.d("RegisterFragment", "Starting registration for: $email with displayName: $displayName")
        
        // Show progress message
        Toast.makeText(requireContext(), "Membuat akun...", Toast.LENGTH_SHORT).show()
        
        authViewModel.signUp(email, password, displayName)
    }

    private fun observeViewModel() {
        authViewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnRegister.isEnabled = !isLoading
        }

        authViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Log.e("RegisterFragment", "Registration error: $it")
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                authViewModel.clearError()
            }
        }

        authViewModel.authState.observe(viewLifecycleOwner) { user ->
            if (user != null) {
                Log.d("RegisterFragment", "Registration successful for user: ${user.uid}")
                Log.d("RegisterFragment", "Waiting for Firestore document creation...")
                
                // Show success message
                Toast.makeText(requireContext(), "Akun berhasil dibuat! Menyiapkan profil...", Toast.LENGTH_LONG).show()
                
                // Add a small delay to ensure Firestore document is created
                view?.postDelayed({
                    try {
                        if (findNavController().currentDestination?.id == R.id.registerFragment) {
                            Log.d("RegisterFragment", "Navigating to home...")
                            Toast.makeText(requireContext(), "Selamat datang!", Toast.LENGTH_SHORT).show()
                            findNavController().navigate(R.id.action_register_to_home)
                        }
                    } catch (e: Exception) {
                        Log.e("RegisterFragment", "Navigation error", e)
                        // Navigation already happened or fragment is not attached
                        // This is safe to ignore
                    }
                }, 3000) // Wait 3 seconds for Firestore operations to complete
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
