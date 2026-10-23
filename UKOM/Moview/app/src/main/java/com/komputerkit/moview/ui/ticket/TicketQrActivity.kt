package com.komputerkit.moview.ui.ticket

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.core.content.res.ResourcesCompat
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.google.zxing.BarcodeFormat
import com.google.zxing.MultiFormatWriter
import com.google.zxing.common.BitMatrix
import com.komputerkit.moview.R
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.TicketQrDetailDto
import com.komputerkit.moview.databinding.ActivityTicketQrBinding
import com.komputerkit.moview.util.ServerConfig
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.showSnackbar
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Locale

class TicketQrActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_ORDER_ID = "extra_order_id"
        const val EXTRA_TICKET_CODE = "extra_ticket_code"

        /** Screenshot/screen-record protection. Disabled so tickets can be shared. */
        const val ENABLE_SECURE_QR = false

        /** Brightness boost while the QR is on screen (0f..1f, -1f = system). */
        private const val QR_SCREEN_BRIGHTNESS = 1f

        private const val STATE_ORDER_ID = "state_order_id"
        private const val STATE_TICKET_CODE = "state_ticket_code"

        /** Cache subfolder for shareable ticket cards (never public storage). */
        private const val SHARED_DIR = "shared_tickets"
    }

    private lateinit var binding: ActivityTicketQrBinding

    private var orderId = 0
    private var ticketCode = ""
    private var previousBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
    private var ticketData: TicketQrDetailDto? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (ENABLE_SECURE_QR) {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }

        binding = ActivityTicketQrBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }
        binding.btnShareTicket.isVisible = false
        binding.btnShareTicket.setOnClickListener { shareTicket() }

        cleanupOldSharedTickets()

        orderId = savedInstanceState?.getInt(STATE_ORDER_ID, 0)
            ?.takeIf { it > 0 }
            ?: intent.getIntExtra(EXTRA_ORDER_ID, 0)
        ticketCode = savedInstanceState?.getString(STATE_TICKET_CODE)
            ?: intent.getStringExtra(EXTRA_TICKET_CODE).orEmpty()

        if (orderId <= 0) {
            showSnackbar("Data tiket tidak valid.", SnackbarType.ERROR)
            finish()
            return
        }

        loadQrDetail()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putInt(STATE_ORDER_ID, orderId)
        outState.putString(STATE_TICKET_CODE, ticketCode)
    }

    override fun onResume() {
        super.onResume()
        boostScreenBrightness()
    }

    override fun onPause() {
        super.onPause()
        restoreScreenBrightness()
    }

    private fun boostScreenBrightness() {
        try {
            val params = window.attributes
            if (previousBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE) {
                previousBrightness = params.screenBrightness
            }
            params.screenBrightness = QR_SCREEN_BRIGHTNESS
            window.attributes = params
        } catch (_: Exception) {
            // Brightness control is cosmetic — never crash over it.
        }
    }

    private fun restoreScreenBrightness() {
        try {
            val params = window.attributes
            params.screenBrightness = previousBrightness
            window.attributes = params
        } catch (_: Exception) {
            // ignore
        }
    }

    /**
     * Loads the order straight from the server by id, authenticated with the
     * signed-in user. Ownership is enforced server-side (user_id + order).
     */
    private fun loadQrDetail() {
        val userId = getSharedPreferences("MoviewPrefs", MODE_PRIVATE).getInt("userId", 0)
        if (userId <= 0) {
            showSnackbar("Sesi tidak valid. Silakan masuk kembali.", SnackbarType.ERROR)
            finish()
            return
        }

        showLoading(true)

        lifecycleScope.launch {
            val response = try {
                withContext(Dispatchers.IO) {
                    RetrofitClient.movieApiService.getTicketQrDetail(userId, orderId, ticketCode)
                }
            } catch (e: Exception) {
                null
            }

            if (isFinishing || isDestroyed) return@launch
            showLoading(false)

            val data = response?.data
            if (response == null || !response.success || data == null) {
                showSnackbar(
                    response?.message ?: "Gagal memuat detail QR tiket.",
                    SnackbarType.ERROR
                )
                finish()
                return@launch
            }

            renderTicket(data)
        }
    }

    private fun showLoading(loading: Boolean) {
        binding.progressBar.isVisible = loading
        if (loading) binding.ivQr.isVisible = false
    }

    private fun renderTicket(data: TicketQrDetailDto) {
        try {
            ticketData = data
            binding.tvMovieTitle.text = data.movie.title
            binding.tvCinema.text = data.cinema.name

            val studioType = data.studio.type?.takeIf { it.isNotBlank() }
            binding.tvStudio.text = if (studioType != null) {
                "${data.studio.name} • $studioType"
            } else {
                data.studio.name
            }

            binding.tvDateTime.text =
                "${formatDate(data.schedule.show_date)} • ${formatTime(data.schedule.show_time)}"
            binding.tvSeats.text =
                "Seat: ${data.seats.mapNotNull { it.seat_code }.joinToString(", ").ifBlank { "-" }}"
            binding.tvTicketCode.text = "TICKET CODE: ${data.ticket_code}"

            Glide.with(this)
                .load(ServerConfig.resolveStorageUrl(data.movie.poster_path))
                .placeholder(com.komputerkit.moview.util.PosterFallbackDrawable(this, data.movie.title))
                .error(com.komputerkit.moview.util.PosterFallbackDrawable(this, data.movie.title))
                .into(binding.ivPoster)

            val isUsed = data.is_scanned || data.is_used
            val isExpired = data.is_expired

            if (isUsed || isExpired) {
                // Dead ticket: never show a scannable code again.
                binding.ivQr.isVisible = false
                binding.ivQr.setImageDrawable(null)
                binding.tvStatus.isVisible = true
                binding.tvStatus.text = when {
                    isUsed -> "Tiket sudah digunakan" +
                        data.scanned_at?.let { "\n${formatScannedAt(it)}" }.orEmpty()
                    else -> "Tiket sudah kedaluwarsa"
                }
                binding.btnShareTicket.isVisible = false
                binding.tvShareWarning.isVisible = false
                return
            }

            binding.tvStatus.isVisible = false
            val qrPayload = data.qr_token
            if (qrPayload.isNullOrBlank()) {
                binding.ivQr.isVisible = false
                binding.btnShareTicket.isVisible = false
                binding.tvShareWarning.isVisible = false
                showSnackbar("QR tiket tidak tersedia.", SnackbarType.ERROR)
                return
            }

            binding.ivQr.isVisible = true
            binding.ivQr.setImageBitmap(generateQrBitmap(qrPayload, 700))
            binding.tvShareWarning.isVisible = true
            binding.btnShareTicket.isVisible = true
        } catch (e: Exception) {
            showSnackbar("Gagal menampilkan QR tiket.", SnackbarType.ERROR)
        }
    }

    // --- Sharing -------------------------------------------------------------

    private fun sharedTicketsDir(): File = File(cacheDir, SHARED_DIR)

    /** Old share images are useless after the chooser closes — drop them. */
    private fun cleanupOldSharedTickets() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val dir = sharedTicketsDir()
                if (!dir.isDirectory) return@launch
                val cutoff = System.currentTimeMillis() - 60 * 60 * 1000L
                dir.listFiles()?.forEach { file ->
                    if (file.isFile && file.lastModified() < cutoff) file.delete()
                }
            } catch (_: Exception) {
                // Cache cleanup is best-effort.
            }
        }
    }

    private fun shareTicket() {
        val data = ticketData ?: run {
            showSnackbar("Tiket belum selesai dimuat.", SnackbarType.ERROR)
            return
        }
        val payload = data.qr_token
        if (payload.isNullOrBlank()) {
            showSnackbar("QR tiket tidak tersedia.", SnackbarType.ERROR)
            return
        }

        binding.btnShareTicket.isEnabled = false

        lifecycleScope.launch {
            val file = try {
                withContext(Dispatchers.IO) {
                    val bitmap = buildTicketCardBitmap(data, payload)
                    val dir = sharedTicketsDir()
                    if (!dir.exists() && !dir.mkdirs()) error("cache dir unavailable")
                    // Only one card is ever needed at a time.
                    dir.listFiles()?.forEach { it.delete() }
                    val out = File(dir, "ticket_${data.order_id}.png")
                    FileOutputStream(out).use { stream ->
                        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
                    }
                    bitmap.recycle()
                    out
                }
            } catch (e: Exception) {
                null
            }

            if (isFinishing || isDestroyed) return@launch
            binding.btnShareTicket.isEnabled = true

            if (file == null) {
                showSnackbar("Gagal membuat gambar tiket.", SnackbarType.ERROR)
                return@launch
            }

            try {
                val uri = FileProvider.getUriForFile(
                    this@TicketQrActivity,
                    "$packageName.fileprovider",
                    file
                )
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "image/png"
                    putExtra(Intent.EXTRA_STREAM, uri)
                    putExtra(Intent.EXTRA_SUBJECT, "Tiket ${data.movie.title}")
                    putExtra(
                        Intent.EXTRA_TEXT,
                        "Tiket ${data.movie.title} — " +
                            "${formatDate(data.schedule.show_date)} ${formatTime(data.schedule.show_time)}. " +
                            "Tiket berlaku satu kali."
                    )
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                startActivity(Intent.createChooser(send, "Bagikan Tiket"))
            } catch (e: Exception) {
                showSnackbar("Tidak ada aplikasi untuk membagikan tiket.", SnackbarType.ERROR)
            }
        }
    }

    /** Simple portrait ticket card: movie, schedule, studio, seats, QR. */
    private fun buildTicketCardBitmap(data: TicketQrDetailDto, qrPayload: String): Bitmap {
        val width = 1080
        val height = 1620
        val padding = 72f

        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.parseColor("#0E1626"))

        val card = RectF(48f, 48f, width - 48f, height - 48f)
        val cardPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#111A2A") }
        canvas.drawRoundRect(card, 40f, 40f, cardPaint)

        val regular = ResourcesCompat.getFont(this, R.font.font_family_inter)
        val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = 56f
            typeface = Typeface.create(regular, Typeface.BOLD)
        }
        val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#8FA3BF")
            textSize = 30f
            typeface = regular
        }
        val valuePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = 38f
            typeface = Typeface.create(regular, Typeface.BOLD)
        }
        val notePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#8FA3BF")
            textSize = 26f
            typeface = regular
        }

        var y = 150f
        canvas.drawText("MOVIEW • TIKET BIOSKOP", padding, y, labelPaint)

        y += 78f
        y = drawWrapped(canvas, data.movie.title, titlePaint, padding, y, width - padding, 64f)

        y += 34f
        val studioType = data.studio.type?.takeIf { it.isNotBlank() }
        val lines = listOf(
            "Tanggal" to formatDate(data.schedule.show_date),
            "Jam" to formatTime(data.schedule.show_time),
            "Studio" to if (studioType != null) "${data.studio.name} • $studioType" else data.studio.name,
            "Kursi" to data.seats.mapNotNull { it.seat_code }.joinToString(", ").ifBlank { "-" },
            "Kode Tiket" to data.ticket_code
        )
        lines.forEach { (label, value) ->
            canvas.drawText(label, padding, y, labelPaint)
            y += 42f
            y = drawWrapped(canvas, value, valuePaint, padding, y, width - padding, 46f)
            y += 26f
        }

        y += 10f
        val qr = generateQrBitmap(qrPayload, 620)
        val qrLeft = (width - qr.width) / 2f
        val qrTop = y
        val whitePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
        canvas.drawRoundRect(
            RectF(qrLeft - 24f, qrTop - 24f, qrLeft + qr.width + 24f, qrTop + qr.height + 24f),
            28f, 28f, whitePaint
        )
        canvas.drawBitmap(qr, qrLeft, qrTop, null)
        qr.recycle()

        y = qrTop + qr.height + 54f
        drawWrapped(
            canvas,
            "Tiket berlaku satu kali. Siapa pun yang memindai lebih dulu bisa masuk.",
            notePaint,
            padding,
            y,
            width - padding,
            36f
        )

        return bitmap
    }

    /** Draws [text] wrapped to [maxWidth]; returns the next baseline y. */
    private fun drawWrapped(
        canvas: Canvas,
        text: String?,
        paint: Paint,
        x: Float,
        startY: Float,
        maxWidth: Float,
        lineHeight: Float
    ): Float {
        if (text.isNullOrBlank()) return startY

        var y = startY
        val words = text.split(' ')
        val line = StringBuilder()
        words.forEach { word ->
            val candidate = if (line.isEmpty()) word else "$line $word"
            if (paint.measureText(candidate) > maxWidth && line.isNotEmpty()) {
                canvas.drawText(line.toString(), x, y, paint)
                y += lineHeight
                line.clear()
                line.append(word)
            } else {
                if (line.isNotEmpty()) line.clear()
                line.append(candidate)
            }
        }
        if (line.isNotEmpty()) {
            canvas.drawText(line.toString(), x, y, paint)
            y += lineHeight
        }
        return y
    }

    private fun generateQrBitmap(content: String, size: Int): Bitmap {        val bitMatrix: BitMatrix = MultiFormatWriter().encode(
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

    private fun formatScannedAt(raw: String): String {
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US)
            val formatter = SimpleDateFormat("dd MMM yyyy • HH:mm", Locale.forLanguageTag("id-ID"))
            val date = parser.parse(raw)
            if (date != null) formatter.format(date) else raw
        } catch (_: Exception) {
            raw
        }
    }
}
