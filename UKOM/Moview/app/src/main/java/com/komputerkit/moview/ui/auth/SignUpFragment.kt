package com.komputerkit.moview.ui.auth

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType
import androidx.core.view.ViewCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentSignUpBinding
import com.komputerkit.moview.data.repository.AuthRepository
import com.komputerkit.moview.util.ServerConfig
import com.komputerkit.moview.util.loadBackdrop
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

        // Hero image: backdrop id 493 of film id 40, same treatment as Login
        binding.ivHero.loadBackdrop(
            ServerConfig.resolveStorageUrl("movies/40/backdrop/OB6fhfbBWeN6aLrVKoPQseKywhkoMhoYrpob4GWr.webp")
        )
        loadHeroCredit()

        setupImmersiveStatusBar()
        setupClickListeners()
        setupValidation()
    }

    // Edge-to-edge: let the bright hero bleed behind the status bar (transparent).
    // The hero has no dark overlay, so use dark status bar icons for readability.
    // Applied on onResume and restored on onPause, because a fragment's onDestroyView
    // runs AFTER the next fragment's onViewCreated — restoring there would clobber the
    // incoming page's edge-to-edge state.
    private fun setupImmersiveStatusBar() {
        // Keep the bottom of the page above the navigation bar so the link is reachable.
        // The hero itself bleeds behind the status bar (no top padding).
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { v, insets ->
            val bottom = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
            v.setPadding(v.paddingLeft, v.paddingTop, v.paddingRight, bottom)
            insets
        }
        applyImmersiveStatusBar(true)
    }

    private fun applyImmersiveStatusBar(immersive: Boolean) {
        val window = requireActivity().window
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        if (immersive) {
            WindowCompat.setDecorFitsSystemWindows(window, false)
            window.statusBarColor = Color.TRANSPARENT
            window.navigationBarColor = Color.TRANSPARENT
            controller.isAppearanceLightStatusBars = true
            controller.isAppearanceLightNavigationBars = false
        } else {
            WindowCompat.setDecorFitsSystemWindows(window, true)
            window.statusBarColor =
                ContextCompat.getColor(requireContext(), R.color.dark_background)
            window.navigationBarColor =
                ContextCompat.getColor(requireContext(), R.color.dark_background)
            controller.isAppearanceLightStatusBars = false
            controller.isAppearanceLightNavigationBars = false
        }
    }

    override fun onResume() {
        super.onResume()
        applyImmersiveStatusBar(true)
    }

    override fun onPause() {
        applyImmersiveStatusBar(false)
        super.onPause()
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

    /** "Scene from [Title] ([Year])" in the hero's bottom-left corner. */
    private fun loadHeroCredit() {
        viewLifecycleOwner.lifecycleScope.launch {
            authRepository.authHeroCredits().onSuccess { credits ->
                val credit = credits.register ?: return@onSuccess
                if (credit.title != null && credit.year != null) {
                    binding.tvHeroCredit.text = "Scene from ${credit.title} (${credit.year})"
                    binding.tvHeroCredit.visibility = View.VISIBLE
                }
            }
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
    }
    
    private fun isValidUsername(username: String): Boolean {
        return username.length >= 3
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
            showSnackbar("Please enter username", SnackbarType.ERROR)
            return
        }
        
        if (!isValidUsername(username)) {
            showSnackbar("Username must be at least 3 characters", SnackbarType.ERROR)
            return
        }
        
        if (email.isEmpty()) {
            showSnackbar("Please enter email", SnackbarType.ERROR)
            return
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            showSnackbar("Please enter valid email", SnackbarType.ERROR)
            return
        }
        
        if (password.isEmpty()) {
            showSnackbar("Please enter password", SnackbarType.ERROR)
            return
        }
        
        if (password.length < 6) {
            showSnackbar("Password must be at least 6 characters", SnackbarType.ERROR)
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
                showSnackbar("Welcome to Moview, ${loginData.username}!", SnackbarType.SUCCESS)
                
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
                showSnackbar(errorMessage, SnackbarType.ERROR)
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
            binding.btnSignUp.text = "Daftar"
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
