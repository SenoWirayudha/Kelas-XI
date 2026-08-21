package com.komputerkit.moview.ui.auth

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentForgotPasswordBinding
import com.komputerkit.moview.data.repository.AuthRepository
import com.komputerkit.moview.util.ServerConfig
import com.komputerkit.moview.util.loadBackdrop
import kotlinx.coroutines.launch

class ForgotPasswordFragment : Fragment() {

    private var _binding: FragmentForgotPasswordBinding? = null
    private val binding get() = _binding!!

    private val authRepository = AuthRepository()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentForgotPasswordBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Hero image: backdrop id 504 of film id 63, same treatment as Login/Register
        binding.ivHero.loadBackdrop(
            ServerConfig.resolveStorageUrl("movies/63/backdrop/wNV04rwch6nbB4u0lv11qAVSIGTaYZp9rCpjUJnL.webp")
        )

        // Keep the bottom of the page above the navigation bar.
        // The hero itself bleeds behind the status bar (no top padding).
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { v, insets ->
            val bottom = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
            v.setPadding(v.paddingLeft, v.paddingTop, v.paddingRight, bottom)
            insets
        }
        applyImmersiveStatusBar(true)

        binding.btnSend.setOnClickListener {
            performForgotPassword()
        }

        binding.btnBackToLogin.setOnClickListener {
            findNavController().navigateUp()
        }
    }

    // Edge-to-edge pattern shared with Login/SignUp: applied on onResume and
    // restored on onPause so transitions between auth pages never clobber
    // each other's status bar state.
    private fun applyImmersiveStatusBar(immersive: Boolean) {
        val window = requireActivity().window
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        if (immersive) {
            WindowCompat.setDecorFitsSystemWindows(window, false)
            window.statusBarColor = Color.TRANSPARENT
            controller.isAppearanceLightStatusBars = true
        } else {
            WindowCompat.setDecorFitsSystemWindows(window, true)
            window.statusBarColor =
                ContextCompat.getColor(requireContext(), R.color.dark_background)
            controller.isAppearanceLightStatusBars = false
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

    private fun performForgotPassword() {
        val email = binding.etEmail.text.toString().trim()

        if (email.isEmpty()) {
            Toast.makeText(requireContext(), "Please enter email", Toast.LENGTH_SHORT).show()
            return
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(requireContext(), "Please enter valid email", Toast.LENGTH_SHORT).show()
            return
        }

        showLoading(true)

        lifecycleScope.launch {
            val result = authRepository.forgotPassword(email)
            result.onSuccess {
                showLoading(false)
                showConfirmation()
            }.onFailure { error ->
                showLoading(false)
                Toast.makeText(
                    requireContext(),
                    error.message ?: "Gagal mengirim link reset. Coba lagi.",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun showLoading(isLoading: Boolean) {
        if (isLoading) {
            binding.btnSend.text = ""
            binding.progressBar.visibility = View.VISIBLE
            binding.tvSendStatus.visibility = View.VISIBLE
            binding.btnSend.isEnabled = false
        } else {
            binding.btnSend.text = "Kirim Link Reset"
            binding.progressBar.visibility = View.GONE
            binding.tvSendStatus.visibility = View.GONE
            binding.btnSend.isEnabled = true
        }
    }

    /**
     * Deliberately generic (the backend never reveals whether the email is
     * registered) to avoid user enumeration.
     */
    private fun showConfirmation() {
        binding.cardEmail.visibility = View.GONE
        binding.btnSend.visibility = View.GONE
        binding.layoutConfirmation.visibility = View.VISIBLE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
