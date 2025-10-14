package com.komputerkit.easybot

import androidx.compose.runtime.mutableStateListOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import kotlinx.coroutines.launch

data class MessageModel(
    val message: String,
    val role: String
)

class ChatViewModel : ViewModel() {

    val messageList = mutableStateListOf<MessageModel>()

    private val generativeModel = GenerativeModel(
        modelName = "gemini-2.5-flash",
        apiKey = Constants.API_KEY
    )

    fun sendMessage(question: String) {
        viewModelScope.launch {
            if (question.isBlank()) return@launch

            // Handle simple commands
            when (question.lowercase().trim()) {
                "clear" -> {
                    messageList.clear()
                    return@launch
                }
            }

            // Add user message
            messageList.add(MessageModel(question, "user"))

            try {
                val response = generativeModel.generateContent(question)
                val responseText = response.text?.trim()

                if (!responseText.isNullOrEmpty()) {
                    messageList.add(MessageModel(responseText, "model"))
                } else {
                    messageList.add(MessageModel("Maaf, tidak ada respons. Coba pertanyaan lain.", "model"))
                }

            } catch (e: Exception) {
                val errorMsg = when {
                    e.message?.contains("quota") == true -> "Quota API habis. Coba lagi nanti."
                    e.message?.contains("503") == true -> "Server sibuk. Tunggu sebentar lalu coba lagi."
                    e.message?.contains("401") == true -> "API key bermasalah. Periksa konfigurasi."
                    else -> "Terjadi kesalahan: ${e.message ?: "Tidak diketahui"}"
                }
                messageList.add(MessageModel(errorMsg, "model"))
            }
        }
    }
}