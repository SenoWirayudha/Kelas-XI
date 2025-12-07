package com.komputerkit.blogapp.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.komputerkit.blogapp.R
import com.komputerkit.blogapp.databinding.FragmentLoginBinding
import com.komputerkit.blogapp.viewmodel.AuthViewModel

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!
    private val authViewModel: AuthViewModel by viewModels()

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
        observeViewModel()
    }

    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            performLogin()
        }

        binding.tvRegisterLink.setOnClickListener {
            findNavController().navigate(R.id.action_login_to_register)
        }
    }

    private fun performLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (email.isEmpty()) {
            binding.tilEmail.error = "Email tidak boleh kosong"
            return
        }
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password tidak boleh kosong"
            return
        }

        binding.tilEmail.error = null
        binding.tilPassword.error = null

        authViewModel.signIn(email, password)
    }

    private fun observeViewModel() {
        authViewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnLogin.isEnabled = !isLoading
        }

        authViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                authViewModel.clearError()
            }
        }

        authViewModel.authState.observe(viewLifecycleOwner) { user ->
            if (user != null) {
                // Use try-catch to handle navigation safely
                try {
                    if (findNavController().currentDestination?.id == R.id.loginFragment) {
                        findNavController().navigate(R.id.action_login_to_home)
                    }
                } catch (e: Exception) {
                    // Navigation already happened or fragment is not attached
                    // This is safe to ignore
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
