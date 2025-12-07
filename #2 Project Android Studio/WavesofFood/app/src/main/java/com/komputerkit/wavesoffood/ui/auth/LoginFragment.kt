package com.komputerkit.wavesoffood.ui.auth

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.komputerkit.wavesoffood.R
import com.komputerkit.wavesoffood.data.Resource
import com.komputerkit.wavesoffood.databinding.FragmentLoginBinding
import com.komputerkit.wavesoffood.repository.UserRepository
import com.komputerkit.wavesoffood.utils.QuickUserSetup
import com.komputerkit.wavesoffood.viewmodel.UserViewModel
import com.komputerkit.wavesoffood.viewmodel.ViewModelFactory
import kotlinx.coroutines.launch

class LoginFragment : Fragment() {
    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!
    private var logoClickCount = 0
    
    private val userRepository = UserRepository()
    private val userViewModel: UserViewModel by viewModels { 
        ViewModelFactory(userRepository = userRepository) 
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

        setupClickListeners()
        checkCurrentUser()
        observeViewModel()
    }

    private fun observeViewModel() {
        userViewModel.user.observe(viewLifecycleOwner) { user ->
            user?.let {
                findNavController().navigate(R.id.action_loginFragment_to_mainFragment)
            }
        }

        userViewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.btnLogin.isEnabled = !isLoading
            // You can add a progress bar here if needed
        }

        userViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupClickListeners() {
        binding.apply {
            btnLogin.setOnClickListener { loginUser() }
            tvRegister.setOnClickListener {
                findNavController().navigate(R.id.action_loginFragment_to_registerFragment)
            }
            tvForgotPassword.setOnClickListener {
                resetPassword()
            }
            
            // Admin setup button (hidden by default)
            btnAdminSetup.setOnClickListener {
                showAdminMenu()
            }
            
            // Show admin button after 5 clicks on logo
            binding.root.findViewById<View>(R.id.ivLogo)?.setOnClickListener {
                logoClickCount++
                if (logoClickCount >= 5) {
                    btnAdminSetup.visibility = View.VISIBLE
                    Toast.makeText(context, "Admin mode activated!", Toast.LENGTH_SHORT).show()
                    logoClickCount = 0
                }
            }
        }
    }

    private fun checkCurrentUser() {
        if (userRepository.isUserLoggedIn()) {
            findNavController().navigate(R.id.action_loginFragment_to_mainFragment)
        }
    }

    private fun loginUser() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            userRepository.login(email, password).collect { resource ->
                when (resource) {
                    is com.komputerkit.wavesoffood.data.Resource.Loading -> {
                        binding.btnLogin.isEnabled = false
                    }
                    is com.komputerkit.wavesoffood.data.Resource.Success -> {
                        binding.btnLogin.isEnabled = true
                        findNavController().navigate(R.id.action_loginFragment_to_mainFragment)
                    }
                    is com.komputerkit.wavesoffood.data.Resource.Error -> {
                        binding.btnLogin.isEnabled = true
                        Toast.makeText(context, resource.message, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun resetPassword() {
        val email = binding.etEmail.text.toString().trim()
        if (email.isEmpty()) {
            Toast.makeText(context, "Please enter your email first", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            userRepository.resetPassword(email).collect { resource ->
                when (resource) {
                    is com.komputerkit.wavesoffood.data.Resource.Success -> {
                        Toast.makeText(context, "Password reset email sent", Toast.LENGTH_SHORT).show()
                    }
                    is com.komputerkit.wavesoffood.data.Resource.Error -> {
                        Toast.makeText(context, resource.message, Toast.LENGTH_SHORT).show()
                    }
                    is com.komputerkit.wavesoffood.data.Resource.Loading -> {
                        // Show loading if needed
                    }
                }
            }
        }
    }

    private fun showAdminMenu() {
        android.app.AlertDialog.Builder(requireContext())
            .setTitle("Quick Setup")
            .setMessage("Create test users for testing:")
            .setPositiveButton("Create Users") { _, _ ->
                QuickUserSetup.createQuickUsers(requireContext())
            }
            .setNeutralButton("Show Credentials") { _, _ ->
                QuickUserSetup.showUserCredentials(requireContext())
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
