package com.komputerkit.moview.ui.ticket

import android.graphics.Bitmap
import android.graphics.Color
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.google.zxing.BarcodeFormat
import com.google.zxing.MultiFormatWriter
import com.google.zxing.common.BitMatrix
import com.komputerkit.moview.R
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.databinding.ActivityTicketQrBinding
import com.komputerkit.moview.util.ServerConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Locale

class TicketQrActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_ORDER_ID = "extra_order_id"
        const val EXTRA_TICKET_CODE = "extra_ticket_code"
    }

    private lateinit var binding: ActivityTicketQrBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTicketQrBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }

        val orderId = intent.getIntExtra(EXTRA_ORDER_ID, 0)
        val ticketCode = intent.getStringExtra(EXTRA_TICKET_CODE).orEmpty()
        val userId = getSharedPreferences("MoviewPrefs", MODE_PRIVATE).getInt("userId", 0)

        if (orderId <= 0 || ticketCode.isBlank() || userId <= 0) {
            Toast.makeText(this, "Data tiket tidak valid.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        loadQrDetail(userId, orderId, ticketCode)
    }

    private fun loadQrDetail(userId: Int, orderId: Int, ticketCode: String) {
        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    RetrofitClient.movieApiService.getTicketQrDetail(userId, orderId, ticketCode)
                }

                if (!response.success || response.data == null) {
                    Toast.makeText(
                        this@TicketQrActivity,
                        response.message ?: "Gagal memuat detail QR tiket.",
                        Toast.LENGTH_SHORT
                    ).show()
                    finish()
                    return@launch
                }

                val data = response.data

                binding.tvMovieTitle.text = data.movie.title
                binding.tvCinema.text = data.cinema.name

                val studioType = data.studio.type?.takeIf { it.isNotBlank() }
                binding.tvStudio.text = if (studioType != null) {
                    "${data.studio.name} • $studioType"
                } else {
                    data.studio.name
                }

                binding.tvDateTime.text = "${formatDate(data.schedule.show_date)} • ${formatTime(data.schedule.show_time)}"
                binding.tvSeats.text = "Seat: ${data.seats.mapNotNull { it.seat_code }.joinToString(", ").ifBlank { "-" }}"
                binding.tvTicketCode.text = "TICKET CODE: ${data.ticket_code}"

                Glide.with(this@TicketQrActivity)
                    .load(ServerConfig.resolveStorageUrl(data.movie.poster_path))
                    .placeholder(R.drawable.ic_movie)
                    .error(R.drawable.ic_movie)
                    .into(binding.ivPoster)

                binding.ivQr.setImageBitmap(generateQrBitmap(data.ticket_code, 700))
            } catch (e: Exception) {
                Toast.makeText(
                    this@TicketQrActivity,
                    e.message ?: "Terjadi kesalahan saat memuat QR tiket.",
                    Toast.LENGTH_SHORT
                ).show()
                finish()
            }
        }
    }

    private fun generateQrBitmap(content: String, size: Int): Bitmap {
        val bitMatrix: BitMatrix = MultiFormatWriter().encode(
            content,
            BarcodeFormat.QR_CODE,
            size,
            size
        )

        val width = bitMatrix.width
        val height = bitMatrix.height
        val pixels = IntArray(width * height)

        for (y in 0 until height) {
            val offset = y * width
            for (x in 0 until width) {
                pixels[offset + x] = if (bitMatrix[x, y]) Color.BLACK else Color.WHITE
            }
        }

        return Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).apply {
            setPixels(pixels, 0, width, 0, 0, width, height)
        }
    }

    private fun formatDate(rawDate: String?): String {
        if (rawDate.isNullOrBlank()) return "-"
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val formatter = SimpleDateFormat("dd MMM yyyy", Locale.forLanguageTag("id-ID"))
            val date = parser.parse(rawDate)
            if (date != null) formatter.format(date) else rawDate
        } catch (_: Exception) {
            rawDate
        }
    }

    private fun formatTime(rawTime: String?): String {
        if (rawTime.isNullOrBlank()) return "-"
        return if (rawTime.length >= 5) rawTime.substring(0, 5) else rawTime
    }
}
