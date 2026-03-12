package com.komputerkit.moview.ui.cinema

import android.os.Bundle
import android.os.CountDownTimer
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ActivityOrderSummaryBinding
import com.komputerkit.moview.ui.cinema.adapter.PaymentMethodAdapter
import com.komputerkit.moview.ui.cinema.model.BookingData
import com.komputerkit.moview.ui.cinema.model.PaymentMethod
import com.komputerkit.moview.util.ServerConfig
import java.text.NumberFormat
import java.util.Locale

class OrderSummaryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOrderSummaryBinding
    private var countDownTimer: CountDownTimer? = null
    private lateinit var paymentAdapter: PaymentMethodAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOrderSummaryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val booking = (intent.getSerializableExtra(EXTRA_BOOKING) as? BookingData)
            ?: BookingData(
                movieTitle = "HOPPERS", moviePosterUrl = "", movieRating = 9.6,
                movieAgeRating = "SU", cinemaName = "CIPLAZ SIDOARJO XXI",
                studioName = "STUDIO 4", studioType = "REGULAR 2D",
                showDate = "11 Mar", showTime = "13:15", ticketPrice = 35000
            )
        val seatsLabel = intent.getStringExtra(EXTRA_SEATS) ?: "C8"
        val rawTotal = intent.getIntExtra(EXTRA_TOTAL, 0)
        val seatCount = seatsLabel.split(",").size

        populateMovieInfo(booking, seatsLabel, seatCount, rawTotal)
        setupPaymentMethods()
        startCountdown(7 * 60 * 1000L)

        binding.btnBack.setOnClickListener { finish() }
        binding.btnPay.setOnClickListener {
            // TODO: complete payment flow
        }
    }

    private fun populateMovieInfo(
        booking: BookingData, seatsLabel: String, seatCount: Int, rawTotal: Int
    ) {
        val fmt = NumberFormat.getNumberInstance(Locale("id","ID"))

        binding.tvMovieTitle.text = booking.movieTitle
        binding.tvRating.text = String.format("%.1f", booking.movieRating)
        binding.tvAgeRating.text = booking.movieAgeRating
        binding.tvCinemaStudio.text = "${booking.cinemaName}, ${booking.studioName}"
        binding.tvShowDatetime.text = "${booking.showDate}, ${booking.showTime}"

        val seatLabel = if (seatCount > 1) "$seatCount TIKET" else "1 TIKET"
        binding.tvTicketCount.text = seatLabel
        binding.tvSeatLabel.text = "KURSI $seatsLabel (${booking.studioType})"
        binding.tvTicketPrice.text = "Rp${fmt.format(booking.ticketPrice)} x $seatCount"
        binding.tvServiceCharge.text = "Rp${fmt.format(booking.serviceCharge)} x $seatCount"

        val total = (booking.ticketPrice + booking.serviceCharge) * seatCount
        binding.tvTotalPrice.text = "Rp${fmt.format(total)}"

        if (booking.moviePosterUrl.isNotBlank()) {
            Glide.with(this).load(ServerConfig.fixUrl(booking.moviePosterUrl)).into(binding.ivPoster)
        }
    }

    private fun setupPaymentMethods() {
        val methods = listOf(
            PaymentMethod(
                id = "dana", name = "DANA",
                description = "Dapatkan diskon Rp20.000 khusus untuk semua pengguna DANA dengan minimal pembelian Rp80.000.",
                logoResId = R.drawable.ic_payment_card,
                promoLabel = "Kartu Kredit/Debit Tersedia"
            ),
            PaymentMethod(
                id = "gopay", name = "GoPay",
                description = "Cashback 50% maks. 10rb untuk transaksi pertama kamu pakai Aplikasi GoPay.",
                logoResId = R.drawable.ic_payment_card
            ),
            PaymentMethod(
                id = "shopeepay", name = "ShopeePay/SPayLater",
                description = "Diskon s/d Rp20.000 untuk semua pengguna dengan minimal transaksi Rp100.000.",
                logoResId = R.drawable.ic_payment_card
            ),
            PaymentMethod(
                id = "ovo", name = "OVO",
                description = "Dapatkan Cashback hingga 10.000 dan cashback 99% khusus pengguna OVO Nabung.",
                logoResId = R.drawable.ic_payment_card
            )
        )

        paymentAdapter = PaymentMethodAdapter(methods) { selected ->
            // Payment method changed
        }
        binding.rvPaymentMethods.layoutManager = LinearLayoutManager(this)
        binding.rvPaymentMethods.adapter = paymentAdapter
        binding.rvPaymentMethods.addItemDecoration(SeatSpaceDecoration(4))
    }

    private fun startCountdown(millisTotal: Long) {
        countDownTimer = object : CountDownTimer(millisTotal, 1000) {
            override fun onTick(remaining: Long) {
                val min = remaining / 60000
                val sec = (remaining % 60000) / 1000
                binding.tvCountdown.text =
                    "Selesaikan pembayaran Anda dalam %02d : %02d".format(min, sec)
            }
            override fun onFinish() {
                binding.tvCountdown.text = "Waktu pembayaran habis"
                binding.btnPay.isEnabled = false
            }
        }.start()
    }

    override fun onDestroy() {
        countDownTimer?.cancel()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_BOOKING = "extra_booking"
        const val EXTRA_SEATS = "extra_seats"
        const val EXTRA_TOTAL = "extra_total"
    }
}
