package com.komputerkit.moview.ui.cinema

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.GridLayoutManager
import com.komputerkit.moview.databinding.ActivitySeatSelectionBinding
import com.komputerkit.moview.ui.cinema.adapter.SeatAdapter
import com.komputerkit.moview.ui.cinema.model.BookingData
import com.komputerkit.moview.ui.cinema.model.Seat
import java.text.NumberFormat
import java.util.Locale

class SeatSelectionActivity : AppCompatActivity() {

    private val logTag = "SeatSelectionActivity"

    private lateinit var binding: ActivitySeatSelectionBinding
    private lateinit var seatAdapter: SeatAdapter
    private lateinit var viewModel: SeatSelectionViewModel
    private lateinit var bookingData: BookingData
    private var gridLayoutManager: GridLayoutManager? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySeatSelectionBinding.inflate(layoutInflater)
        setContentView(binding.root)
        viewModel = ViewModelProvider(this)[SeatSelectionViewModel::class.java]

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
        observeViewModel()

        if (bookingData.scheduleId > 0) {
            viewModel.loadSeatLayout(bookingData.scheduleId)
        } else {
            binding.tvSelectedSeats.text = "Schedule tidak valid"
            Log.e(logTag, "Missing scheduleId in booking payload")
        }
    }

    private fun setupSeats() {
        seatAdapter = SeatAdapter(mutableListOf(), bookingData.ticketPrice) { selected, total ->
            onSeatsChanged(selected, total)
        }

        gridLayoutManager = GridLayoutManager(this, 1)
        binding.rvSeats.layoutManager = gridLayoutManager
        binding.rvSeats.adapter = seatAdapter
        binding.rvSeats.itemAnimator = null
    }

    private fun observeViewModel() {
        viewModel.uiState.observe(this) { state ->
            binding.btnOrderSummary.isEnabled = !state.isLoading && seatAdapter.getSelectedSeats().isNotEmpty()
            binding.btnOrderSummary.alpha = if (binding.btnOrderSummary.isEnabled) 1f else 0.5f

            if (state.error != null) {
                binding.tvSelectedSeats.text = state.error
                Log.e(logTag, "seatLayoutError=${state.error}")
                return@observe
            }

            if (state.seats.isNotEmpty()) {
                val spanCount = state.columns.coerceAtLeast(1)
                if (gridLayoutManager?.spanCount != spanCount) {
                    gridLayoutManager = GridLayoutManager(this, spanCount)
                    binding.rvSeats.layoutManager = gridLayoutManager
                    binding.rvSeats.adapter = seatAdapter
                }
                seatAdapter.submitSeats(state.seats)
            }
        }
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
        val selectedSeatIds = selected.mapNotNull { it.seatId }
        val bookingPayload = bookingData.copy(selectedSeatIds = selectedSeatIds)

        val intent = Intent(this, OrderSummaryActivity::class.java)
        intent.putExtra(OrderSummaryActivity.EXTRA_BOOKING, bookingPayload)
        intent.putExtra(OrderSummaryActivity.EXTRA_SEATS, seatsLabel)
        intent.putExtra(OrderSummaryActivity.EXTRA_TOTAL, total)
        startActivity(intent)
    }

    companion object {
        const val EXTRA_BOOKING = "extra_booking"
    }
}
