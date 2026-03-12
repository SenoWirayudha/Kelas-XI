package com.komputerkit.moview.ui.cinema

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.ActivitySeatSelectionBinding
import com.komputerkit.moview.ui.cinema.adapter.SeatAdapter
import com.komputerkit.moview.ui.cinema.model.BookingData
import com.komputerkit.moview.ui.cinema.model.Seat
import com.komputerkit.moview.ui.cinema.model.SeatStatus
import java.text.NumberFormat
import java.util.Locale

class SeatSelectionActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySeatSelectionBinding
    private lateinit var seatAdapter: SeatAdapter
    private lateinit var bookingData: BookingData

    private val columnCount = 9   // columns in the seat grid

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySeatSelectionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        bookingData = (intent.getSerializableExtra(EXTRA_BOOKING) as? BookingData)
            ?: BookingData(
                movieTitle = "HOPPERS", moviePosterUrl = "", movieRating = 9.6,
                movieAgeRating = "SU", cinemaName = "CIPLAZ SIDOARJO XXI",
                studioName = "STUDIO 4", studioType = "REGULAR 2D",
                showDate = "11 Mar", showTime = "13:15", ticketPrice = 35000
            )

        binding.tvCinemaName.text = bookingData.cinemaName
        binding.tvShowInfo.text = "${bookingData.showDate} | ${bookingData.showTime}"

        setupSeats()
        setupClickListeners()
    }

    private fun setupSeats() {
        val rows = listOf("A","B","C","D","E","F","G","H","J")
        val numbers = (4..12).toList()

        // Build seat list; mark some as booked for demo
        val bookedIds = setOf("B7","B8","B9")
        val seats = mutableListOf<Seat>()
        for (row in rows) {
            for (num in numbers) {
                val id = "$row$num"
                seats.add(Seat(row, num,
                    if (id in bookedIds) SeatStatus.BOOKED else SeatStatus.AVAILABLE))
            }
        }

        seatAdapter = SeatAdapter(seats, columnCount, bookingData.ticketPrice) { selected, total ->
            onSeatsChanged(selected, total)
        }

        binding.rvSeats.layoutManager =
            GridLayoutManager(this, columnCount)
        binding.rvSeats.adapter = seatAdapter
        binding.rvSeats.itemAnimator = null

        // Fix each seat cell to a square
        binding.rvSeats.addItemDecoration(SeatSpaceDecoration(4))
    }

    private fun onSeatsChanged(selected: List<Seat>, total: Int) {
        val fmt = NumberFormat.getNumberInstance(Locale("id","ID"))
        if (selected.isEmpty()) {
            binding.tvTotalPrice.text = "Rp -"
            binding.tvSelectedSeats.text = "Kursi belum dipilih"
            binding.btnOrderSummary.isEnabled = false
            binding.btnOrderSummary.alpha = 0.5f
        } else {
            binding.tvTotalPrice.text = "Rp ${fmt.format(total)}"
            binding.tvSelectedSeats.text = selected.joinToString(", ") { it.id }
            binding.btnOrderSummary.isEnabled = true
            binding.btnOrderSummary.alpha = 1f
        }
        updateOrderButtonStyle(selected.isNotEmpty())
    }

    private fun updateOrderButtonStyle(active: Boolean) {
        binding.btnOrderSummary.setTextColor(
            getColor(if (active) android.R.color.white else com.komputerkit.moview.R.color.text_secondary)
        )
        binding.btnOrderSummary.backgroundTintList =
            android.content.res.ColorStateList.valueOf(
                if (active) 0xFF4A4CE8.toInt() else 0xFF252A34.toInt()
            )
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener { finish() }

        binding.btnCloseBanner.setOnClickListener {
            binding.bannerInfo.visibility = View.GONE
        }

        binding.btnOrderSummary.setOnClickListener {
            navigateToOrderSummary()
        }
    }

    private fun navigateToOrderSummary() {
        val selected = seatAdapter.getSelectedSeats()
        val seatsLabel = selected.joinToString(", ") { it.id }
        val total = selected.size * bookingData.ticketPrice

        val intent = Intent(this, OrderSummaryActivity::class.java)
        intent.putExtra(OrderSummaryActivity.EXTRA_BOOKING, bookingData)
        intent.putExtra(OrderSummaryActivity.EXTRA_SEATS, seatsLabel)
        intent.putExtra(OrderSummaryActivity.EXTRA_TOTAL, total)
        startActivity(intent)
    }

    companion object {
        const val EXTRA_BOOKING = "extra_booking"
    }
}
