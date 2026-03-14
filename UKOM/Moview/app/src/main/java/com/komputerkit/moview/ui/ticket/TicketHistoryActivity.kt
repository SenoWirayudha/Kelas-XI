package com.komputerkit.moview.ui.ticket

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.databinding.ActivityTicketHistoryBinding
import com.komputerkit.moview.util.ServerConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Locale

class TicketHistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityTicketHistoryBinding
    private lateinit var adapter: TicketHistoryAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTicketHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupClicks()
        loadTicketHistory()
    }

    private fun setupRecyclerView() {
        adapter = TicketHistoryAdapter { item ->
            when (item.status) {
                TicketStatus.PAID -> {
                    Toast.makeText(this, "Buka QR tiket: ${item.title}", Toast.LENGTH_SHORT).show()
                }

                TicketStatus.EXPIRED -> {
                    Toast.makeText(this, "Buka detail tiket: ${item.title}", Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.rvTicketHistory.layoutManager = LinearLayoutManager(this)
        binding.rvTicketHistory.adapter = adapter
    }

    private fun setupClicks() {
        binding.btnBack.setOnClickListener { finish() }
    }

    private fun loadTicketHistory() {
        val userId = getSharedPreferences("MoviewPrefs", MODE_PRIVATE).getInt("userId", 0)
        if (userId <= 0) {
            adapter.submitList(emptyList())
            Toast.makeText(this, "User belum login.", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    RetrofitClient.movieApiService.getUserTickets(userId)
                }

                if (!response.success) {
                    Toast.makeText(
                        this@TicketHistoryActivity,
                        response.message ?: "Gagal memuat riwayat tiket.",
                        Toast.LENGTH_SHORT
                    ).show()
                    adapter.submitList(emptyList())
                    return@launch
                }

                val items = response.data.orEmpty().map { dto ->
                    val seats = dto.seats.mapNotNull { it.seat_code }.filter { it.isNotBlank() }
                    val studioType = dto.studio.type?.takeIf { it.isNotBlank() }
                    val studioInfo = if (studioType != null) {
                        "${dto.studio.name} • $studioType"
                    } else {
                        dto.studio.name
                    }

                    TicketHistoryItem(
                        posterUrl = ServerConfig.resolveStorageUrl(dto.movie.poster_path),
                        title = dto.movie.title,
                        cinemaName = dto.cinema.name,
                        studioInfo = studioInfo,
                        showDate = formatDate(dto.schedule.show_date),
                        showTime = formatTime(dto.schedule.show_time),
                        seatInfo = if (seats.isEmpty()) "Seat: -" else "Seat: ${seats.joinToString(", ")}",
                        status = if (dto.order_status.equals("paid", ignoreCase = true)) {
                            TicketStatus.PAID
                        } else {
                            TicketStatus.EXPIRED
                        }
                    )
                }

                adapter.submitList(items)

                if (items.isEmpty()) {
                    Toast.makeText(
                        this@TicketHistoryActivity,
                        "Belum ada riwayat tiket.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@TicketHistoryActivity,
                    e.message ?: "Terjadi kesalahan saat memuat riwayat tiket.",
                    Toast.LENGTH_SHORT
                ).show()
                adapter.submitList(emptyList())
            }
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
