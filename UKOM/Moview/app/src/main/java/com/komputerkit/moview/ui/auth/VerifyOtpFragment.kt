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
import androidx.activity.OnBackPressedCallback
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavOptions
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
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
 *
 * Hardened: the pending verification (email, flow, absolute expiry + resend
 * timestamps) is persisted locally so the app returns here after a process
 * death or an email-app round-trip; the typed code survives recreation via a
 * ViewModel + savedInstanceState; countdowns are derived from absolute
 * timestamps so they never reset on relaunch; both action buttons are inert
 * while a request is in flight; leaving (system back or the back button) is
 * guarded by a confirmation.
 */
class VerifyOtpFragment : Fragment() {

    private var _binding: FragmentVerifyOtpBinding? = null
    private val binding get() = _binding!!

    private val authRepository = AuthRepository()
    private val movieRepository = com.komputerkit.moview.data.repository.MovieRepository()

    private lateinit var viewModel: VerifyOtpViewModel

    private var email: String = ""
    private var flow: String = "register"
    private var resendTimer: CountDownTimer? = null
    private var otpHasError: Boolean = false
    private var isVerifying: Boolean = false
    private var isResending: Boolean = false
    private var backCallback: OnBackPressedCallback? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = ViewModelProvider(this)[VerifyOtpViewModel::class.java]
    }

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

        if (!resolveEmail(savedInstanceState)) {
            // Nothing to verify (no args, no surviving local state) — leave
            // with a clear message instead of crashing on an empty email.
            return
        }

        binding.tvOtpEmail.text = email
        setupOtpInput()
        restoreOtpText(savedInstanceState)

        // Hero image: backdrop id 785 of film id 112 (same edge-to-edge
        // pattern as Login — bright, no dark overlay).
        binding.ivHero.loadBackdrop(
            ServerConfig.resolveStorageUrl("movies/112/backdrop/8BFLik9kl00OMjVvF0bFErnRlBE5PfLqMnaXpHtD.webp")
        )
        loadHeroCredit()
        adjustHeroGuideline()

        setupImmersiveStatusBar()
        setupClickListeners()

        // Countdown is derived from the persisted absolute timestamp, so it
        // is correct after backgrounding/relaunch (never restarts at 60s).
        startResendCooldownFromStore()
    }

    /**
     * Resolves the email/flow to verify. Prefers the navigation arguments,
     * falls back to the locally-persisted pending state (process death /
     * relaunch), and finally leaves for Login with a Snackbar when neither
     * exists. Returns false when the screen cannot be shown.
     */
    private fun resolveEmail(savedInstanceState: Bundle?): Boolean {
        email = arguments?.getString("email").orEmpty()
        flow = arguments?.getString("flow") ?: "register"

        if (email.isEmpty()) {
            // No args — restore the pending verification if one survived.
            val state = OtpStateStore.getValid(requireContext())
            if (state != null) {
                email = state.email
                flow = state.flow
                return true
            }
            // Nothing pending — do not crash; return to Login.
            showSnackbar("Sesi verifikasi tidak ditemukan. Silakan login kembali.", SnackbarType.ERROR)
            goToLogin()
            return false
        }

        // Email came from arguments. Persist it so a later process death can
        // resume here — but only on a FRESH entry (a configuration change
        // re-runs onViewCreated with the same args and must not reset the
        // expiry/cooldown timestamps).
        val existing = OtpStateStore.peek(requireContext())
        if (existing == null || existing.email != email) {
            OtpStateStore.save(requireContext(), email, flow)
        }
        return true
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
        // The user may have sat in the email app past the OTP's lifetime —
        // clear the (now-expired) state and leave rather than sit here.
        checkStillValid()
    }

    override fun onPause() {
        applyImmersiveStatusBar(false)
        super.onPause()
    }

    /** Clears + leaves if the pending OTP expired while we were backgrounded. */
    private fun checkStillValid() {
        if (_binding == null || email.isEmpty()) return
        val state = OtpStateStore.peek(requireContext()) ?: return
        if (System.currentTimeMillis() > state.expiresAt) {
            OtpStateStore.clear(requireContext())
            viewModel.updateOtp("")
            if (flow == "register") {
                showSnackbar(
                    "Kode OTP kedaluwarsa. Silakan daftar ulang untuk mendapatkan kode baru.",
                    SnackbarType.ERROR
                )
                goToLogin()
            } else {
                showSnackbar(
                    "Kode OTP kedaluwarsa. Silakan minta kode baru dari Pengaturan profil.",
                    SnackbarType.ERROR
                )
                findNavController().navigateUp()
            }
        }
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

        // Any edit after an error resets the red borders + message, and keeps
        // the ViewModel in sync so the input survives recreation.
        binding.otpView.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                viewModel.updateOtp(s?.toString().orEmpty())
                if (otpHasError) setOtpErrorBorder(false)
            }
        })

        // Tap: re-focus + show the keyboard again (covers focus stolen by
        // scrolling/other views between taps).
        binding.otpView.setOnClickListener {
            focusOtpInput()
        }
    }

    /**
     * Seeds the boxes with the surviving input. The ViewModel value wins on a
     * configuration change; savedInstanceState covers process death (where the
     * ViewModel is cleared). An empty restore keeps the original auto-focus.
     */
    private fun restoreOtpText(savedInstanceState: Bundle?) {
        val restored = viewModel.otpText.value
            ?: savedInstanceState?.getString(STATE_OTP)
        if (!restored.isNullOrEmpty()) {
            binding.otpView.setText(restored)
        }

        // Auto-focus + number keyboard as soon as the screen opens.
        binding.otpView.requestFocus()
        binding.otpView.post { focusOtpInput() }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(STATE_OTP, currentOtp())
    }

    /** The 6-digit code straight from the library view. */
    private fun currentOtp(): String = _binding?.otpView?.text?.toString().orEmpty()

    /** Clears the boxes (used after a successful resend). */
    private fun clearOtp() {
        binding.otpView.setText("")
        viewModel.updateOtp("")
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
            if (_binding == null) return@launch
            binding.tvHeroCredit.text = "Scene from $title ($year)"
            binding.tvHeroCredit.visibility = View.VISIBLE
        }
    }

    private fun setupClickListeners() {
        // Both the in-page back button and the system back gesture/button go
        // through the same confirmation so an accidental exit is prevented.
        binding.btnBack.setOnClickListener { confirmExit() }

        backCallback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                confirmExit()
            }
        }
        // Tied to viewLifecycleOwner so it is removed automatically in
        // onDestroyView (no leak, no double-handling on recreation).
        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner, backCallback!!)

        binding.btnVerify.setOnClickListener {
            performVerify()
        }

        binding.btnResend.setOnClickListener {
            performResend()
        }
    }

    /** Asks before discarding the in-flight verification. */
    private fun confirmExit() {
        if (_binding == null) return
        val message = if (flow == "register") {
            "Proses verifikasi akan dihentikan. Kamu bisa mendaftar lagi kapan saja untuk mendapatkan kode baru."
        } else {
            "Proses verifikasi akan dihentikan. Kamu bisa memulai ulang dari Pengaturan profil kapan saja."
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Batalkan verifikasi?")
            .setMessage(message)
            .setPositiveButton("Ya, batalkan") { _, _ -> cancelVerification() }
            .setNegativeButton("Lanjutkan verifikasi", null)
            .show()
    }

    /** Leaves the OTP screen after a confirmed cancel. */
    private fun cancelVerification() {
        OtpStateStore.clear(requireContext())
        viewModel.updateOtp("")
        // Non-register flows (change password / delete account) simply go
        // back to Edit Profile — only Sign-Up belongs on Sign-Up/Login.
        if (flow != "register") {
            findNavController().navigateUp()
            return
        }
        // From Sign-Up the natural "back" is the Sign-Up form; after a
        // relaunch straight into OTP there is nothing beneath us but Home,
        // so land on Login instead of a logged-out Home.
        val previous = findNavController().previousBackStackEntry?.destination?.id
        if (previous == R.id.signUpFragment) {
            findNavController().navigateUp()
        } else {
            goToLogin()
        }
    }

    /** Pops everything back to the graph start and opens Login. */
    private fun goToLogin() {
        try {
            val navOptions = NavOptions.Builder()
                .setPopUpTo(navControllerStartId(), false)
                .setEnterAnim(R.anim.slide_in_left)
                .setExitAnim(R.anim.slide_out_right)
                .setPopEnterAnim(R.anim.slide_in_left)
                .setPopExitAnim(R.anim.slide_out_right)
                .build()
            findNavController().navigate(R.id.loginFragment, null, navOptions)
        } catch (e: Exception) {
            // Destination unreachable — best-effort exit, never crash.
            findNavController().navigateUp()
        }
    }

    private fun navControllerStartId(): Int = findNavController().graph.startDestinationId

    private fun performVerify() {
        if (isVerifying) return
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
        isVerifying = true
        showLoading(true)
        // Inert while the request is in flight (both action buttons).
        binding.btnResend.isEnabled = false

        // viewLifecycleOwner: the coroutine is cancelled the moment the view
        // goes away, so callbacks can never touch a dead binding.
        if (flow == "register") {
            verifyRegisterCode(code)
        } else {
            verifyActionCode(code)
        }
    }

    /** Register flow: a successful code creates the account + starts the session. */
    private fun verifyRegisterCode(code: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            authRepository.verifyOtp(email, code)
                .onSuccess { loginData ->
                    if (!isAdded || _binding == null) return@onSuccess
                    isVerifying = false
                    OtpStateStore.clear(requireContext())
                    viewModel.updateOtp("")
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
                    if (!isAdded || _binding == null) return@onFailure
                    isVerifying = false
                    showLoading(false)
                    // Restore the resend button to its true cooldown state.
                    startResendCooldownFromStore()
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

    /** delete_account: the code is verified and the account removed atomically. */
    private fun verifyActionCode(code: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            val result = authRepository.deleteAccount(email, code = code)
            if (!isAdded || _binding == null) return@launch
            isVerifying = false
            showLoading(false)
            result
                .onSuccess {
                    OtpStateStore.clear(requireContext())
                    viewModel.updateOtp("")
                    finishAccountDeletion()
                }
                .onFailure { error ->
                    startResendCooldownFromStore()
                    val message = ErrorMessage.fromApi(error, "Kode OTP salah. Coba lagi.")
                        ?: "Kode OTP salah. Coba lagi."
                    showSnackbar(message, SnackbarType.ERROR)
                    setOtpErrorBorder(true)
                }
        }
    }

    /** Local session teardown after the server removed the account. */
    private fun finishAccountDeletion() {
        OtpStateStore.clear(requireContext())
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        showSnackbar("Akun berhasil dihapus", SnackbarType.SUCCESS)
        goToLogin()
    }

    private fun performResend() {
        if (isResending) return
        isResending = true
        binding.btnResend.isEnabled = false
        // Inert while the request is in flight (both action buttons).
        binding.btnVerify.isEnabled = false

        viewLifecycleOwner.lifecycleScope.launch {
            val result = when (flow) {
                "delete_account" -> authRepository.requestDeleteAccountOtp(email)
                else -> authRepository.resendOtp(email)
            }
            if (!isAdded || _binding == null) return@launch
            isResending = false
            result
                .onSuccess {
                    OtpStateStore.markResendSent(requireContext())
                    showSnackbar("Kode OTP baru sudah dikirim ke emailmu", SnackbarType.SUCCESS)
                    clearOtp()
                    startResendCooldownFromStore()
                    binding.btnVerify.isEnabled = true
                }
                .onFailure { error ->
                    ErrorMessage.fromApi(error, "Gagal mengirim ulang kode. Coba lagi.")?.let { message ->
                        showSnackbar(message, SnackbarType.ERROR)
                    }
                    // Restore both buttons to their true cooldown/usable state.
                    startResendCooldownFromStore()
                    binding.btnVerify.isEnabled = true
                }
        }
    }

    /**
     * "Kirim ulang (45 dtk)" countdown derived from the persisted absolute
     * timestamp — correct after backgrounding/relaunch. Enables at 0.
     */
    private fun startResendCooldownFromStore() {
        if (_binding == null) return
        val resendAvailableAt = OtpStateStore.peek(requireContext())?.resendAvailableAt ?: 0L
        val remaining = resendAvailableAt - System.currentTimeMillis()
        if (remaining <= 0L) {
            resendTimer?.cancel()
            binding.btnResend.isEnabled = true
            binding.btnResend.text = "Kirim ulang kode"
        } else {
            startResendCooldown(remaining)
        }
    }

    /** Raw countdown; [millis] is the remaining time until resend unlocks. */
    private fun startResendCooldown(millis: Long) {
        if (_binding == null) return
        resendTimer?.cancel()
        binding.btnResend.isEnabled = false

        resendTimer = object : CountDownTimer(millis, 1000) {
            override fun onTick(remaining: Long) {
                if (_binding == null) return
                val seconds = (remaining / 1000).toInt() + if (remaining % 1000 > 0) 1 else 0
                binding.btnResend.text = "Kirim ulang ($seconds dtk)"
            }

            override fun onFinish() {
                if (_binding == null) return
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
            // A new account created via OTP always belongs to email/password.
            putString("accountProvider", "email")
            apply()
        }
    }

    private fun showLoading(isLoading: Boolean) {
        if (_binding == null) return
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
        // backCallback is removed automatically via its viewLifecycleOwner.
        backCallback = null
        _binding = null
    }

    companion object {
        private const val STATE_OTP = "state_otp"
    }
}
