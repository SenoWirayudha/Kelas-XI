package com.komputerkit.aplikasimonitoringkelas.preview

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.komputerkit.aplikasimonitoringkelas.LoginScreen
import com.komputerkit.aplikasimonitoringkelas.ui.theme.AplikasiMonitoringKelasTheme

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun LoginScreenPreview() {
    AplikasiMonitoringKelasTheme {
        LoginScreen(
            onLoginClick = { _, _, _ -> }
        )
    }
}
