package com.komputerkit.moview.ui.auth

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.os.CountDownTimer
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.card.MaterialCardView
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentVerifyOtpBinding
import com.komputerkit.moview.data.repository.AuthRepository
import com.komputerkit.moview.util.ServerConfig
import com.komputerkit.moview.util.loadBackdrop
import kotlinx.coroutines.launch

/**
 * Register step 2: asks for the 6-digit code emailed by the backend.
 * The account only becomes active (and the session starts) after the code
 * verifies; resend has a 60-second cooldown handled by the server.
 */
class VerifyOtpFragment : Fragment() {

    private var _binding: FragmentVerifyOtpBinding? = null
    private val binding get() = _binding!!

    private val authRepository = AuthRepository()
    private val movieRepository = com.komputerkit.moview.data.repository.MovieRepository()

    private var email: String = ""
    private var resendTimer: CountDownTimer? = null
    private var otpHasError: Boolean = false

    private val otpBoxCards: List<MaterialCardView>
        get() = listOf(
            binding.otpBox0, binding.otpBox1, binding.otpBox2,
            binding.otpBox3, binding.otpBox4, binding.otpBox5
        )

    private val otpBoxDigits: List<android.widget.TextView>
        get() = listOf(
            binding.tvOtpDigit0, binding.tvOtpDigit1, binding.tvOtpDigit2,
            binding.tvOtpDigit3, binding.tvOtpDigit4, binding.tvOtpDigit5
        )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentVerifyOtpBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        email = arguments?.getString("email") ?: ""
        if (email.isEmpty()) {
            // No email passed (shouldn't happen) — nothing to verify.
            findNavController().navigateUp()
            return
        }

        binding.tvOtpEmail.text = email
        setupOtpInput()

        // Hero image: backdrop id 785 of film id 112 (same edge-to-edge
        // pattern as Login — bright, no dark overlay).
        binding.ivHero.loadBackdrop(
            ServerConfig.resolveStorageUrl("movies/112/backdrop/8BFLik9kl00OMjVvF0bFErnRlBE5PfLqMnaXpHtD.webp")
        )
        loadHeroCredit()

        setupImmersiveStatusBar()
        setupClickListeners()

        // The server also enforces its own 60s cooldown per email.
        startResendCooldown(60_000)
    }

    private fun setupImmersiveStatusBar() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(v.paddingLeft, v.paddingTop, v.paddingRight, bars.bottom)
            val lp = binding.btnBackContainer.layoutParams as ConstraintLayout.LayoutParams
            lp.topMargin = bars.top + (8 * resources.displayMetrics.density).toInt()
            binding.btnBackContainer.layoutParams = lp
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

    /**
     * One hidden numeric field feeds the 6 visible boxes. Typing advances the
     * highlighted box, Backspace steps back, and pasting a full 6-digit code
     * fills every box at once. Taps fall through the boxes onto the field,
     * which opens the number keyboard.
     */
    private fun setupOtpInput() {
        binding.etOtp.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                val raw = s?.toString().orEmpty()
                val digits = raw.filter { it.isDigit() }.take(6)
                if (digits != raw) {
                    binding.etOtp.setText(digits)
                    binding.etOtp.setSelection(digits.length)
                    return
                }
                // New input invalidates any previous error state.
                if (otpHasError) showOtpError(null)
                renderOtpBoxes()
            }
        })

        renderOtpBoxes()
    }

    /** Draws the current code into the boxes: active box = primary border, others grey; error = all red. */
    private fun renderOtpBoxes() {
        val code = binding.etOtp.text.toString()
        val accent = ContextCompat.getColor(requireContext(), R.color.accent_blue)
        val grey = ContextCompat.getColor(requireContext(), R.color.input_border)
        val red = ContextCompat.getColor(requireContext(), R.color.red)
        val thin = dp(1)
        val thick = dp(2)

        otpBoxCards.forEachIndexed { i, card ->
            otpBoxDigits[i].text = code.getOrNull(i)?.toString() ?: ""
            when {
                otpHasError -> {
                    card.strokeColor = red
                    card.strokeWidth = thick
                }
                code.length < 6 && i == code.length -> {
                    card.strokeColor = accent
                    card.strokeWidth = thick
                }
                else -> {
                    card.strokeColor = grey
                    card.strokeWidth = thin
                }
            }
        }
    }

    /** Red borders on all boxes + message under them; null clears the error. */
    private fun showOtpError(message: String?) {
        otpHasError = message != null
        binding.tvOtpError.text = message.orEmpty()
        binding.tvOtpError.visibility = if (message != null) View.VISIBLE else View.GONE
        renderOtpBoxes()
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density + 0.5f).toInt()

    /** "Scene from [Title] ([Year])" for the backdrop actually shown (film 112). */
    private fun loadHeroCredit() {
        viewLifecycleOwner.lifecycleScope.launch {
            val movie = movieRepository.getMovieDetail(112) ?: return@launch
            val title = movie.title ?: return@launch
            val year = movie.releaseYear ?: return@launch
            binding.tvHeroCredit.text = "Scene from $title ($year)"
            binding.tvHeroCredit.visibility = View.VISIBLE
        }
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }

        binding.btnVerify.setOnClickListener {
            performVerify()
        }

        binding.btnResend.setOnClickListener {
            performResend()
        }
    }

    private fun performVerify() {
        val code = binding.etOtp.text.toString().trim()

        if (code.isEmpty()) {
            showOtpError("Kode OTP wajib diisi")
            return
        }

        if (!code.all { it.isDigit() } || code.length != 6) {
            showOtpError("Kode OTP harus 6 digit angka")
            return
        }

        showOtpError(null)
        showLoading(true)

        lifecycleScope.launch {
            authRepository.verifyOtp(email, code)
                .onSuccess { loginData ->
                    saveLoginState(
                        loginData.email,
                        loginData.username,
                        loginData.token,
                        loginData.userId
                    )
                    showLoading(false)
                    showSnackbar("Welcome to Moview, ${loginData.username}!", SnackbarType.SUCCESS)
                    findNavController().navigate(R.id.action_verifyOtp_to_home)
                }
                .onFailure { error ->
                    showLoading(false)
                    showOtpError(
                        error.message ?: "Kode OTP salah. Coba lagi."
                    )
                }
        }
    }

    private fun performResend() {
        binding.btnResend.isEnabled = false

        lifecycleScope.launch {
            authRepository.resendOtp(email)
                .onSuccess {
                    showSnackbar("Kode OTP baru sudah dikirim ke emailmu", SnackbarType.SUCCESS)
                    showOtpError(null)
                    binding.etOtp.text?.clear()
                    startResendCooldown(60_000)
                }
                .onFailure { error ->
                    showSnackbar(
                        error.message ?: "Gagal mengirim ulang kode. Coba lagi.",
                        SnackbarType.ERROR
                    )
                    binding.btnResend.isEnabled = false
                }
        }
    }

    /** "Kirim ulang (45 dtk)" countdown; the button enables at 0. */
    private fun startResendCooldown(millis: Long) {
        resendTimer?.cancel()
        binding.btnResend.isEnabled = false

        resendTimer = object : CountDownTimer(millis, 1000) {
            override fun onTick(remaining: Long) {
                val seconds = (remaining / 1000).toInt() + if (remaining % 1000 > 0) 1 else 0
                binding.btnResend.text = "Kirim ulang ($seconds dtk)"
            }

            override fun onFinish() {
                binding.btnResend.isEnabled = true
                binding.btnResend.text = "Kirim ulang kode"
            }
        }.start()
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
            binding.btnVerify.text = ""
            binding.progressBar.visibility = View.VISIBLE
            binding.tvVerifyStatus.visibility = View.VISIBLE
            binding.btnVerify.isEnabled = false
        } else {
            binding.btnVerify.text = "Verifikasi"
            binding.progressBar.visibility = View.GONE
            binding.tvVerifyStatus.visibility = View.GONE
            binding.btnVerify.isEnabled = true
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        resendTimer?.cancel()
        resendTimer = null
        _binding = null
    }
}
