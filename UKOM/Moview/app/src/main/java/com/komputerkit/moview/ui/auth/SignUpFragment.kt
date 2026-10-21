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
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentSignUpBinding
import com.komputerkit.moview.data.repository.AuthRepository
import com.komputerkit.moview.util.ErrorMessage
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
        adjustHeroGuideline()

        setupImmersiveStatusBar()
        setupClickListeners()
    }

    /** Backdrop is ~38% of the screen on common phones (360x800dp); shorter
     *  screens shrink ONLY the backdrop down to a 25% floor. */
    private fun adjustHeroGuideline() {
        val heightDp = resources.displayMetrics.heightPixels / resources.displayMetrics.density
        val percent = (0.25f + (heightDp - 640f) * 0.13f / 160f).coerceIn(0.25f, 0.38f)
        val lp = binding.guidelineHero.layoutParams as ConstraintLayout.LayoutParams
        lp.guidePercent = percent
        binding.guidelineHero.layoutParams = lp
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

        // Validate inputs — errors surface via Snackbar (no inline error icons)
        when {
            username.isEmpty() -> {
                showSnackbar("Username wajib diisi", SnackbarType.ERROR)
                return
            }
            !isValidUsername(username) -> {
                showSnackbar("Username minimal 3 karakter", SnackbarType.ERROR)
                return
            }
            email.isEmpty() -> {
                showSnackbar("Email wajib diisi", SnackbarType.ERROR)
                return
            }
            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> {
                showSnackbar("Masukkan email yang valid", SnackbarType.ERROR)
                return
            }
            password.isEmpty() -> {
                showSnackbar("Password wajib diisi", SnackbarType.ERROR)
                return
            }
            password.length < 6 -> {
                showSnackbar("Password minimal 6 karakter", SnackbarType.ERROR)
                return
            }
        }

        // Show loading state
        showLoading(true)

        // Register step 1: backend emails a 6-digit OTP; the account is only
        // created after the OTP screen is verified.
        lifecycleScope.launch {
            val result = authRepository.register(username, email, password)

            result.onSuccess { otpData ->
                showLoading(false)

                // Navigate to the OTP verification screen
                val bundle = Bundle().apply {
                    putString("email", otpData.email)
                }
                findNavController().navigate(R.id.action_signUp_to_verifyOtp, bundle)
            }.onFailure { error ->
                showLoading(false)
                // 409 responses name the offending column — message goes to Snackbar
                val raw = ErrorMessage.serverMessageRaw(error)
                when {
                    raw?.contains("Username already taken", ignoreCase = true) == true ->
                        showSnackbar("Username sudah dipakai", SnackbarType.ERROR)
                    raw?.contains("Email already registered", ignoreCase = true) == true ->
                        showSnackbar("Email sudah terdaftar", SnackbarType.ERROR)
                    else -> ErrorMessage.fromApi(error, "Pendaftaran gagal. Coba lagi.")?.let { message ->
                        showSnackbar(message, SnackbarType.ERROR)
                    }
                }
            }
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
