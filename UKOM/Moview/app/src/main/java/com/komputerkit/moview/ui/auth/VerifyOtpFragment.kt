package com.komputerkit.moview.ui.auth

import android.content.Context
import android.content.res.ColorStateList
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
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentVerifyOtpBinding
import com.komputerkit.moview.data.repository.AuthRepository
import com.komputerkit.moview.util.ErrorMessage
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
        adjustHeroGuideline()

        setupImmersiveStatusBar()
        setupClickListeners()

        // The server also enforces its own 60s cooldown per email.
        startResendCooldown(60_000)
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

    private fun setupImmersiveStatusBar() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            // Include the IME so the page grows while the keyboard is open —
            // the Verifikasi button stays reachable by scrolling.
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(v.paddingLeft, v.paddingTop, v.paddingRight, bars.bottom + ime.bottom)
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

    private fun setupOtpInput() {
        // The library calls setTextIsSelectable(false) in OtpView's constructor,
        // which forces focusable=false, focusableInTouchMode=false and
        // cursorVisible=false AFTER the XML attributes are applied. A tap can
        // therefore never focus the view, so the keyboard never opens (other
        // fields in the app are plain EditTexts without that call). Restore
        // normal EditText focusability.
        binding.otpView.isFocusable = true
        binding.otpView.isFocusableInTouchMode = true
        binding.otpView.isCursorVisible = true

        // Any edit after an error resets the red borders + message.
        binding.otpView.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (otpHasError) setOtpErrorBorder(false)
            }
        })

        // Tap: re-focus + show the keyboard again (covers focus stolen by
        // scrolling/other views between taps).
        binding.otpView.setOnClickListener {
            focusOtpInput()
        }

        // Auto-focus + number keyboard as soon as the screen opens.
        binding.otpView.requestFocus()
        binding.otpView.post { focusOtpInput() }
    }

    /** The 6-digit code straight from the library view. */
    private fun currentOtp(): String = binding.otpView.text?.toString().orEmpty()

    /** Clears the boxes (used after a successful resend). */
    private fun clearOtp() {
        binding.otpView.setText("")
    }

    /** Focus the pin view and explicitly request the number keyboard. */
    private fun focusOtpInput() {
        binding.otpView.requestFocus()
        binding.otpView.post {
            // Edge-to-edge: the insets controller is the reliable way to
            // toggle the IME; fall back to the classic IMM call.
            val controller = ViewCompat.getWindowInsetsController(requireView())
            if (controller != null) {
                controller.show(WindowInsetsCompat.Type.ime())
            } else {
                val imm = requireContext()
                    .getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                imm.showSoftInput(binding.otpView, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
            }
        }
    }

    /** Red borders on all boxes while an error is active; null restores normal colors. */
    private fun setOtpErrorBorder(invalid: Boolean) {
        otpHasError = invalid
        binding.otpView.setLineColor(
            if (invalid) {
                ColorStateList.valueOf(ContextCompat.getColor(requireContext(), R.color.red))
            } else {
                ContextCompat.getColorStateList(requireContext(), R.color.otp_border_color)
                    ?: ColorStateList.valueOf(ContextCompat.getColor(requireContext(), R.color.input_border))
            }
        )
    }

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
        val code = currentOtp()

        if (code.isEmpty()) {
            showSnackbar("Kode OTP wajib diisi", SnackbarType.ERROR)
            setOtpErrorBorder(true)
            return
        }

        if (!code.all { it.isDigit() } || code.length != 6) {
            showSnackbar("Kode OTP harus 6 digit angka", SnackbarType.ERROR)
            setOtpErrorBorder(true)
            return
        }

        setOtpErrorBorder(false)
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
                    // Backend OTP messages (wrong code / expired / throttle) are
                    // already Indonesian; network/5xx are surfaced globally.
                    // Message goes to Snackbar — the boxes just keep red borders.
                    val message = ErrorMessage.fromApi(error, "Kode OTP salah. Coba lagi.")
                        ?: "Kode OTP salah. Coba lagi."
                    showSnackbar(message, SnackbarType.ERROR)
                    setOtpErrorBorder(true)
                }
        }
    }

    private fun performResend() {
        binding.btnResend.isEnabled = false

        lifecycleScope.launch {
            authRepository.resendOtp(email)
                .onSuccess {
                    showSnackbar("Kode OTP baru sudah dikirim ke emailmu", SnackbarType.SUCCESS)
                    clearOtp()
                    startResendCooldown(60_000)
                }
                .onFailure { error ->
                    ErrorMessage.fromApi(error, "Gagal mengirim ulang kode. Coba lagi.")?.let { message ->
                        showSnackbar(message, SnackbarType.ERROR)
                    }
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
