package com.komputerkit.moview.ui.cinema

import android.os.Bundle
import android.os.CountDownTimer
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import android.view.View
import android.content.Intent
import com.bumptech.glide.Glide
import com.komputerkit.moview.BuildConfig
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.ActivityOrderSummaryBinding
import com.komputerkit.moview.ui.cinema.model.BookingData
import com.komputerkit.moview.ui.ticket.TicketHistoryActivity
import com.komputerkit.moview.util.ServerConfig
import com.midtrans.sdk.corekit.callback.TransactionFinishedCallback
import com.midtrans.sdk.corekit.core.MidtransSDK
import com.midtrans.sdk.corekit.core.themes.CustomColorTheme
import com.midtrans.sdk.corekit.models.snap.TransactionResult
import com.midtrans.sdk.uikit.SdkUIFlowBuilder
import java.text.NumberFormat
import java.util.Locale

class OrderSummaryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOrderSummaryBinding
    private val viewModel: OrderSummaryViewModel by viewModels()
    private var countDownTimer: CountDownTimer? = null
    private lateinit var bookingData: BookingData
    private var selectedSeatLabel: String = ""
    private var latestOrderCode: String? = null
    private var shouldSyncOnResume: Boolean = false

    private val appPrefs by lazy {
        getSharedPreferences("MoviewPrefs", MODE_PRIVATE)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOrderSummaryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        bookingData = (intent.getSerializableExtra(EXTRA_BOOKING) as? BookingData)
            ?: BookingData(
                movieTitle = "HOPPERS", moviePosterUrl = "", movieRating = 9.6,
                movieAgeRating = "SU", cinemaName = "CIPLAZ SIDOARJO XXI",
                studioName = "STUDIO 4", studioType = "REGULAR 2D",
                showDate = "11 Mar", showTime = "13:15", ticketPrice = 35000
            )
        selectedSeatLabel = intent.getStringExtra(EXTRA_SEATS)
            ?: bookingData.selectedSeatIds.joinToString(",")
        latestOrderCode = null
        shouldSyncOnResume = false

        val seatCount = calculateSeatCount(selectedSeatLabel, bookingData.selectedSeatIds)
        populateMovieInfo(bookingData, selectedSeatLabel, seatCount)
        initializeMidtransSdk()
        observeViewModel()
        startCountdown(7 * 60 * 1000L)

        binding.btnBack.setOnClickListener { finish() }
        binding.btnPay.setOnClickListener {
            val userId = getSharedPreferences("MoviewPrefs", MODE_PRIVATE).getInt("userId", 0)
            val selectedSeats = bookingData.selectedSeatIds
            shouldSyncOnResume = false
            viewModel.createPayment(
                userId = userId,
                scheduleId = bookingData.scheduleId,
                selectedSeats = selectedSeats
            )
        }
    }

    private fun populateMovieInfo(
        booking: BookingData,
        seatsLabel: String,
        seatCount: Int
    ) {
        val fmt = NumberFormat.getNumberInstance(Locale("id", "ID"))

        binding.tvMovieTitle.text = booking.movieTitle
        binding.tvAgeRating.text = booking.movieAgeRating
        binding.tvCinemaStudio.text = "${booking.cinemaName}, ${booking.studioName}"
        binding.tvShowDatetime.text = "${booking.showDate}, ${booking.showTime}"
        applyBrandBadge(booking.serviceName.ifBlank { booking.cinemaName })

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

    private fun observeViewModel() {
        viewModel.uiState.observe(this) { state ->
            binding.btnPay.isEnabled = !state.isCreatingPayment
            binding.btnPay.text = if (state.isCreatingPayment) "MEMPROSES..." else "SELESAIKAN PEMBAYARAN"
            binding.layoutSyncStatus.visibility = if (state.isSyncingPayment && shouldSyncOnResume) View.VISIBLE else View.GONE

            state.error?.let {
                Toast.makeText(this, it, Toast.LENGTH_SHORT).show()
                viewModel.clearError()
            }

            state.paymentResult?.let { result ->
                latestOrderCode = result.order_code
                appPrefs.edit().putString(KEY_PENDING_ORDER_CODE, result.order_code).apply()
                shouldSyncOnResume = true
                launchSnapPayment(result.snap_token)
                viewModel.clearPaymentResult()
            }

            state.syncMessage?.let {
                Toast.makeText(this, it, Toast.LENGTH_SHORT).show()
                viewModel.clearSyncMessage()
            }

            if (state.paymentCompleted) {
                clearPendingOrderCode()
                viewModel.clearPaymentCompleted()
                navigateToActiveTickets()
                return@observe
            }

            val syncedOrderStatus = state.syncedOrderStatus
            if (!syncedOrderStatus.isNullOrBlank()) {
                if (syncedOrderStatus == "paid" || syncedOrderStatus == "cancelled") {
                    clearPendingOrderCode()
                }
                viewModel.clearSyncedOrderStatus()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (!shouldSyncOnResume) {
            return
        }

        val pendingOrderCode = latestOrderCode
        if (!pendingOrderCode.isNullOrBlank()) {
            binding.tvSyncStatus.text = "Menunggu pembayaran selesai..."
            viewModel.syncPaymentStatus(pendingOrderCode)
        }
    }

    private fun clearPendingOrderCode() {
        latestOrderCode = null
        appPrefs.edit().remove(KEY_PENDING_ORDER_CODE).apply()
    }

    private fun initializeMidtransSdk() {
        val clientKey = BuildConfig.MIDTRANS_CLIENT_KEY
        if (clientKey.isBlank()) return

        val merchantBaseUrl = if (BuildConfig.MIDTRANS_MERCHANT_BASE_URL.isNotBlank()) {
            BuildConfig.MIDTRANS_MERCHANT_BASE_URL
        } else {
            "http://${ServerConfig.HOST}:8000/api/"
        }

        SdkUIFlowBuilder.init()
            .setClientKey(clientKey)
            .setContext(applicationContext)
            .setMerchantBaseUrl(merchantBaseUrl)
            .setTransactionFinishedCallback(TransactionFinishedCallback { result: TransactionResult? ->
                runOnUiThread {
                    handleTransactionResult(result)
                }
            })
            .setColorTheme(
                CustomColorTheme(
                    "#4A4CE8",
                    "#4A4CE8",
                    "#4A4CE8"
                )
            )
            .enableLog(true)
            .buildSDK()
    }

    private fun launchSnapPayment(snapToken: String) {
        val clientKey = BuildConfig.MIDTRANS_CLIENT_KEY
        if (clientKey.isBlank()) {
            Toast.makeText(this, "MIDTRANS_CLIENT_KEY belum diisi", Toast.LENGTH_LONG).show()
            return
        }

        runCatching {
            MidtransSDK.getInstance().startPaymentUiFlow(this, snapToken)
        }.onFailure {
            Toast.makeText(this, "Gagal membuka Snap UI", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handleTransactionResult(result: TransactionResult?) {
        if (result == null) {
            Toast.makeText(this, "Pembayaran dibatalkan", Toast.LENGTH_SHORT).show()
            return
        }

        val status = result.status ?: ""
        val orderCode = latestOrderCode

        if (!orderCode.isNullOrBlank()) {
            when (status) {
                TransactionResult.STATUS_SUCCESS,
                TransactionResult.STATUS_PENDING,
                TransactionResult.STATUS_FAILED,
                TransactionResult.STATUS_INVALID -> {
                    shouldSyncOnResume = true
                    viewModel.syncPaymentStatus(orderCode)
                    return
                }
            }
        }

        when (status) {
            TransactionResult.STATUS_SUCCESS -> {
                Toast.makeText(this, "Pembayaran berhasil", Toast.LENGTH_SHORT).show()
            }
            TransactionResult.STATUS_PENDING -> {
                Toast.makeText(this, "Pembayaran pending", Toast.LENGTH_SHORT).show()
            }
            TransactionResult.STATUS_FAILED -> {
                Toast.makeText(this, "Pembayaran gagal", Toast.LENGTH_SHORT).show()
            }
            TransactionResult.STATUS_INVALID -> {
                Toast.makeText(this, "Transaksi tidak valid", Toast.LENGTH_SHORT).show()
            }
            else -> {
                Toast.makeText(this, "Status transaksi: $status", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun navigateToActiveTickets() {
        val intent = Intent(this, TicketHistoryActivity::class.java).apply {
            putExtra(TicketHistoryActivity.EXTRA_INITIAL_TAB, TicketHistoryActivity.TAB_ACTIVE)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
        finish()
    }

    private fun calculateSeatCount(seatsLabel: String, selectedSeatIds: List<Int>): Int {
        val labelCount = seatsLabel
            .split(",")
            .map { it.trim() }
            .count { it.isNotBlank() }
        return when {
            labelCount > 0 -> labelCount
            selectedSeatIds.isNotEmpty() -> selectedSeatIds.size
            else -> 1
        }
    }

    private fun applyBrandBadge(source: String) {
        val normalized = source.uppercase(Locale.getDefault())
        val brandText: String
        val colorRes: Int

        when {
            normalized.contains("XXI") -> {
                brandText = "XXI"
                colorRes = R.color.brand_xxi
            }
            normalized.contains("CGV") -> {
                brandText = "CGV"
                colorRes = R.color.brand_cgv
            }
            normalized.contains("CINEPOLIS") -> {
                brandText = "CINEPOLIS"
                colorRes = R.color.brand_cinepolis
            }
            else -> {
                brandText = if (bookingData.serviceName.isNotBlank()) bookingData.serviceName else "BIOSKOP"
                colorRes = R.color.accent_blue
            }
        }

        binding.tvBrand.text = brandText
        val background = binding.tvBrand.background.mutate()
        val color = ContextCompat.getColor(this, colorRes)
        if (background is android.graphics.drawable.GradientDrawable) {
            background.setColor(color)
        } else {
            binding.tvBrand.setBackgroundColor(color)
        }
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
        private const val KEY_PENDING_ORDER_CODE = "pending_order_code"
    }
}
