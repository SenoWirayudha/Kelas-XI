package com.komputerkit.moview.ui.ticket

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.core.content.res.ResourcesCompat
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import com.google.zxing.common.BitMatrix
import com.komputerkit.moview.R
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.api.TicketQrDetailDto
import com.komputerkit.moview.databinding.ActivityTicketQrBinding
import com.komputerkit.moview.util.PosterFallbackDrawable
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
import kotlin.math.roundToInt

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

        // ---------------------------------------------------------------------------
        // Share card layout. Every number is in Figma/SVG pixels (design canvas 1154x1452)
        // and is used as-is: the canvas is translated so the dark card's top-left corner
        // becomes (0,0), and only the card area (1066x1350) is exported.
        // ---------------------------------------------------------------------------

        // Card (dark body) inside the design canvas
        private const val CARD_LEFT = 52f
        private const val CARD_TOP = 85f
        private const val CARD_RIGHT = 1118f
        private const val CARD_BOTTOM = 1435f
        private const val CARD_WIDTH = 1066
        private const val CARD_HEIGHT = 1350
        private const val CARD_CENTER_X = 585f
        private val CARD_COLOR = Color.parseColor("#0E1525")

        // Audience/seat strip (res/drawable-nodpi/ticket_seats_strip.png, already cropped to
        // 1080x213). Stretched over the bottom of the canvas at 58% opacity.
        private const val SEATS_OPACITY = 0.58f
        private const val SEATS_DST_LEFT = 0f
        private const val SEATS_DST_TOP = 1224f
        private const val SEATS_DST_RIGHT = 1154f
        private const val SEATS_DST_BOTTOM = 1452f

        // Ticket-shaped header background (res/drawable-nodpi/ticket_header_bg.png, 1114x813)
        private const val HEADER_LEFT = 24.6f
        private const val HEADER_TOP = 0f
        private const val HEADER_RIGHT = 1145.5f
        private const val HEADER_BOTTOM = 818f

        // Poster 327x490, radius 50
        private const val POSTER_LEFT = 132f
        private const val POSTER_TOP = 144f
        private const val POSTER_WIDTH = 327f
        private const val POSTER_HEIGHT = 490f
        private const val POSTER_CORNER = 50f

        // Text column: left edge x=488, right edge x=1038 (same as the seat pills)
        private const val TEXT_X = 487.5f
        private const val TEXT_MAX_WIDTH = 550f

        // "Moview • Tiket Film"
        private const val HEADER_LABEL_BASELINE = 193f
        private const val HEADER_LABEL_X_2 = 573.8f
        private const val BULLET_X = 564f
        private const val BULLET_Y = 186f
        private const val BULLET_RADIUS = 2f

        // Title: 40px bold, 2 lines max, line height 48
        private const val TITLE_SIZE = 40f
        private const val TITLE_BASELINE = 245f
        private const val TITLE_LINE_HEIGHT = 48f
        private const val TITLE_MAX_LINES = 2

        // Labels 20px light, values 24px bold. Baselines measured per row.
        private const val LABEL_SIZE = 20f
        private const val VALUE_SIZE = 24f
        private const val ROW_DATE_LABEL_BASELINE = 339f
        private const val ROW_DATE_VALUE_BASELINE = 377f
        private const val ROW_TIME_LABEL_BASELINE = 418f
        private const val ROW_TIME_VALUE_BASELINE = 458f
        private const val ROW_STUDIO_LABEL_BASELINE = 498f
        private const val ROW_STUDIO_VALUE_BASELINE = 540f

        // Seat pills: 85x42, radius 20, gap 9, right-aligned to x=1038, bottom row top y=627
        private const val PILL_WIDTH = 85f
        private const val PILL_HEIGHT = 42f
        private const val PILL_GAP = 9f
        private const val PILL_RADIUS = 20f
        private const val PILLS_RIGHT = 1038f
        private const val PILLS_BOTTOM_ROW_TOP = 627f
        private const val PILLS_PER_ROW = 3
        private const val PILL_TEXT_BASELINE_OFFSET = 30f
        private const val SEAT_LABEL_OFFSET = 15f

        // QR 460x460 at (355,747), white quiet zone included in the image
        private const val QR_LEFT = 355f
        private const val QR_TOP = 747f
        private const val QR_SIZE = 460
        private const val QR_QUIET_ZONE_MODULES = 2

        // Ticket code 40px bold, centered; note 20px light, centered
        private const val CODE_SIZE = 40f
        private const val CODE_BASELINE = 1291f
        private const val CODE_LABEL_BASELINE = 1245f
        private const val NOTE_BASELINE = 1363f

        // Moview wordmark (res/drawable-nodpi/moview_wordmark.png, 1920x1080)
        private const val LOGO_LEFT = 62f
        private const val LOGO_TOP = 1368f
        private const val LOGO_WIDTH = 133.3f
        private const val LOGO_HEIGHT = 75f
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

            binding.tvStudio.text = studioText(data)

            binding.tvDateTime.text =
                "${formatDate(data.schedule.show_date)} • ${formatTime(data.schedule.show_time)}"
            binding.tvSeats.text =
                "Seat: ${data.seats.mapNotNull { it.seat_code }.joinToString(", ").ifBlank { "-" }}"
            binding.tvTicketCode.text = "TICKET CODE: ${data.ticket_code}"

            Glide.with(this)
                .load(ServerConfig.resolveStorageUrl(data.movie.poster_path))
                .placeholder(PosterFallbackDrawable(this, data.movie.title))
                .error(PosterFallbackDrawable(this, data.movie.title))
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

    private fun studioText(data: TicketQrDetailDto): String {
        val studioType = data.studio.type?.takeIf { it.isNotBlank() }
        return if (studioType != null) "${data.studio.name} • $studioType" else data.studio.name
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

    /**
     * Draws the share card exactly as in the Figma design. Must run off the main thread
     * (it downloads the poster and decodes the branding bitmaps).
     *
     * Required resources (res/drawable-nodpi/):
     *  - ticket_header_bg.png       (from /branding/Tiket background header.png)
     *  - ticket_seats_strip.png     (pre-cropped audience/seats strip, 1080x213)
     *  - moview_wordmark.png        (Moview logo, transparent PNG)
     */
    private fun buildTicketCardBitmap(data: TicketQrDetailDto, qrPayload: String): Bitmap {
        val bitmap = Bitmap.createBitmap(CARD_WIDTH, CARD_HEIGHT, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        // Work in design coordinates; only the dark card area is exported.
        canvas.translate(-CARD_LEFT, -CARD_TOP)
        canvas.clipRect(CARD_LEFT, CARD_TOP, CARD_RIGHT, CARD_BOTTOM)

        val fill = Paint(Paint.ANTI_ALIAS_FLAG)
        val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

        // 1. Card body
        fill.color = CARD_COLOR
        canvas.drawRect(CARD_LEFT, CARD_TOP, CARD_RIGHT, CARD_BOTTOM, fill)

        // 2. Audience / seats strip at the bottom, 58% opacity
        decodeDrawable(R.drawable.ticket_seats_strip)?.let { seats ->
            val dst = RectF(SEATS_DST_LEFT, SEATS_DST_TOP, SEATS_DST_RIGHT, SEATS_DST_BOTTOM)
            val paint = Paint(bitmapPaint).apply { alpha = (255 * SEATS_OPACITY).roundToInt() }
            canvas.drawBitmap(seats, null, dst, paint)
            seats.recycle()
        }

        // 3. Ticket-shaped header background
        decodeDrawable(R.drawable.ticket_header_bg)?.let { header ->
            canvas.drawBitmap(
                header,
                null,
                RectF(HEADER_LEFT, HEADER_TOP, HEADER_RIGHT, HEADER_BOTTOM),
                bitmapPaint
            )
            header.recycle()
        }

        // 4. Poster (327x490, radius 50)
        val posterRect = RectF(
            POSTER_LEFT,
            POSTER_TOP,
            POSTER_LEFT + POSTER_WIDTH,
            POSTER_TOP + POSTER_HEIGHT
        )
        val poster = loadRemoteBitmap(ServerConfig.resolveStorageUrl(data.movie.poster_path))
        if (poster != null) {
            val posterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                shader = centerCropShader(poster, posterRect)
            }
            canvas.drawRoundRect(posterRect, POSTER_CORNER, POSTER_CORNER, posterPaint)
            poster.recycle()
        } else {
            canvas.save()
            canvas.clipPath(Path().apply { addRoundRect(posterRect, POSTER_CORNER, POSTER_CORNER, Path.Direction.CW) })
            PosterFallbackDrawable(this, data.movie.title).apply {
                setBounds(
                    posterRect.left.roundToInt(),
                    posterRect.top.roundToInt(),
                    posterRect.right.roundToInt(),
                    posterRect.bottom.roundToInt()
                )
                draw(canvas)
            }
            canvas.restore()
        }

        // 5. Text
        val labelPaint = textPaint(LABEL_SIZE, weight = 300, align = Paint.Align.LEFT)
        val valuePaint = textPaint(VALUE_SIZE, weight = 700, align = Paint.Align.LEFT)
        val titlePaint = textPaint(TITLE_SIZE, weight = 700, align = Paint.Align.LEFT)

        // "Moview • Tiket Film"
        canvas.drawText("Moview", TEXT_X, HEADER_LABEL_BASELINE, labelPaint)
        canvas.drawCircle(BULLET_X, BULLET_Y, BULLET_RADIUS, textPaint(LABEL_SIZE, 300, Paint.Align.LEFT))
        canvas.drawText("Tiket Film", HEADER_LABEL_X_2, HEADER_LABEL_BASELINE, labelPaint)

        // Title (max 2 lines)
        wrapLines(data.movie.title, titlePaint, TEXT_MAX_WIDTH, TITLE_MAX_LINES)
            .forEachIndexed { index, line ->
                canvas.drawText(line, TEXT_X, TITLE_BASELINE + index * TITLE_LINE_HEIGHT, titlePaint)
            }

        // Info rows
        drawInfoRow(
            canvas, "Tanggal", formatDateLong(data.schedule.show_date),
            ROW_DATE_LABEL_BASELINE, ROW_DATE_VALUE_BASELINE, labelPaint, valuePaint
        )
        drawInfoRow(
            canvas, "Jam", formatTimeDot(data.schedule.show_time),
            ROW_TIME_LABEL_BASELINE, ROW_TIME_VALUE_BASELINE, labelPaint, valuePaint
        )
        drawInfoRow(
            canvas, "Studio", studioText(data),
            ROW_STUDIO_LABEL_BASELINE, ROW_STUDIO_VALUE_BASELINE, labelPaint, valuePaint
        )

        // 6. Seats: "Kursi" label + pills (right-aligned, extra rows grow upward)
        drawSeats(
            canvas,
            data.seats.mapNotNull { it.seat_code }.ifEmpty { listOf("-") },
            labelPaint
        )

        // 7. QR
        val qr = generateQrBitmap(qrPayload, QR_SIZE, QR_QUIET_ZONE_MODULES)
        canvas.drawBitmap(qr, QR_LEFT, QR_TOP, null)
        qr.recycle()

        // 8. Ticket code + note (centered on the card)
        val codeLabelPaint = textPaint(LABEL_SIZE, weight = 300, align = Paint.Align.CENTER)
        canvas.drawText("Kode Tiket", CARD_CENTER_X, CODE_LABEL_BASELINE, codeLabelPaint)

        val codePaint = textPaint(CODE_SIZE, weight = 700, align = Paint.Align.CENTER)
        val code = fitSingleLine(data.ticket_code, codePaint, CARD_RIGHT - CARD_LEFT - 120f)
        canvas.drawText(code, CARD_CENTER_X, CODE_BASELINE, codePaint)

        val notePaint = textPaint(LABEL_SIZE, weight = 300, align = Paint.Align.CENTER)
        canvas.drawText("*Tiket hanya berlaku satu kali", CARD_CENTER_X, NOTE_BASELINE, notePaint)

        // 9. Logo
        decodeDrawable(R.drawable.moview_wordmark, sampleSize = 4)?.let { logo ->
            canvas.drawBitmap(
                logo,
                null,
                RectF(LOGO_LEFT, LOGO_TOP, LOGO_LEFT + LOGO_WIDTH, LOGO_TOP + LOGO_HEIGHT),
                bitmapPaint
            )
            logo.recycle()
        }

        return bitmap
    }

    private fun drawInfoRow(
        canvas: Canvas,
        label: String,
        value: String,
        labelBaseline: Float,
        valueBaseline: Float,
        labelPaint: Paint,
        valuePaint: Paint
    ) {
        canvas.drawText(label, TEXT_X, labelBaseline, labelPaint)
        canvas.drawText(fitSingleLine(value, valuePaint, TEXT_MAX_WIDTH), TEXT_X, valueBaseline, valuePaint)
    }

    private fun drawSeats(canvas: Canvas, seats: List<String>, labelPaint: Paint) {
        val rows = seats.chunked(PILLS_PER_ROW)
        val pillFill = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = CARD_COLOR }
        val pillText = textPaint(VALUE_SIZE, weight = 700, align = Paint.Align.CENTER)
        val rowPitch = PILL_HEIGHT + PILL_GAP

        rows.forEachIndexed { rowIndex, rowSeats ->
            val top = PILLS_BOTTOM_ROW_TOP - (rows.size - 1 - rowIndex) * rowPitch
            val rowWidth = rowSeats.size * PILL_WIDTH + (rowSeats.size - 1) * PILL_GAP
            val left = PILLS_RIGHT - rowWidth

            rowSeats.forEachIndexed { index, code ->
                val pillLeft = left + index * (PILL_WIDTH + PILL_GAP)
                canvas.drawRoundRect(
                    RectF(pillLeft, top, pillLeft + PILL_WIDTH, top + PILL_HEIGHT),
                    PILL_RADIUS, PILL_RADIUS, pillFill
                )
                canvas.drawText(
                    fitSingleLine(code, pillText, PILL_WIDTH - 16f),
                    pillLeft + PILL_WIDTH / 2f,
                    top + PILL_TEXT_BASELINE_OFFSET,
                    pillText
                )
            }
        }

        // Label sits above the top row, starting at that row's horizontal center.
        val topRowCount = rows.first().size
        val topRowWidth = topRowCount * PILL_WIDTH + (topRowCount - 1) * PILL_GAP
        val labelX = PILLS_RIGHT - topRowWidth / 2f
        val topRowTop = PILLS_BOTTOM_ROW_TOP - (rows.size - 1) * rowPitch
        canvas.drawText("Kursi", labelX, topRowTop - SEAT_LABEL_OFFSET, labelPaint)
    }

    // --- Drawing helpers -----------------------------------------------------

    /** White Inter paint; weight 300 = Light, 700 = Bold. */
    private fun textPaint(size: Float, weight: Int, align: Paint.Align): Paint {
        val base = ResourcesCompat.getFont(this, R.font.font_family_inter) ?: Typeface.DEFAULT
        val face = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            Typeface.create(base, weight, false)
        } else {
            Typeface.create(base, if (weight >= 600) Typeface.BOLD else Typeface.NORMAL)
        }
        return Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = size
            typeface = face
            textAlign = align
        }
    }

    /** Greedy word wrap into at most [maxLines] lines; the last line is ellipsized. */
    private fun wrapLines(text: String?, paint: Paint, maxWidth: Float, maxLines: Int): List<String> {
        val words = text.orEmpty().trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
        if (words.isEmpty()) return listOf("-")

        val all = mutableListOf<String>()
        var current = ""
        words.forEach { word ->
            val candidate = if (current.isEmpty()) word else "$current $word"
            if (paint.measureText(candidate) > maxWidth && current.isNotEmpty()) {
                all.add(current)
                current = word
            } else {
                current = candidate
            }
        }
        if (current.isNotEmpty()) all.add(current)

        if (all.size <= maxLines) return all.map { ellipsize(it, paint, maxWidth) }

        val kept = all.take(maxLines - 1).toMutableList()
        kept.add(ellipsize(all.drop(maxLines - 1).joinToString(" "), paint, maxWidth))
        return kept
    }

    /** Shrinks the text down to 70% of its size, then ellipsizes if it still does not fit. */
    private fun fitSingleLine(text: String?, paint: Paint, maxWidth: Float): String {
        val value = text.orEmpty().ifBlank { "-" }
        val original = paint.textSize
        var guard = 0
        while (paint.measureText(value) > maxWidth && paint.textSize > original * 0.7f && guard < 40) {
            paint.textSize -= original * 0.01f
            guard++
        }
        return ellipsize(value, paint, maxWidth)
    }

    private fun ellipsize(text: String, paint: Paint, maxWidth: Float): String {
        if (paint.measureText(text) <= maxWidth) return text
        var value = text
        while (value.length > 1 && paint.measureText("$value…") > maxWidth) {
            value = value.dropLast(1)
        }
        return "$value…"
    }

    private fun decodeDrawable(resId: Int, sampleSize: Int = 1): Bitmap? {
        return try {
            val options = BitmapFactory.Options().apply {
                inScaled = false
                inSampleSize = sampleSize
            }
            BitmapFactory.decodeResource(resources, resId, options)
        } catch (_: Throwable) {
            null // decorations are best-effort
        }
    }

    /** Blocking Glide download (call from a background thread). Returns a software copy. */
    private fun loadRemoteBitmap(model: Any?): Bitmap? {
        if (model == null) return null
        return try {
            val loaded = Glide.with(applicationContext)
                .asBitmap()
                .disallowHardwareConfig()
                .load(model)
                .submit()
                .get()
            loaded?.copy(Bitmap.Config.ARGB_8888, false)
        } catch (_: Exception) {
            null
        }
    }

    private fun centerCropShader(bitmap: Bitmap, target: RectF): BitmapShader {
        val shader = BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        val targetRatio = target.width() / target.height()
        val bitmapRatio = bitmap.width.toFloat() / bitmap.height.toFloat()

        val srcWidth: Float
        val srcHeight: Float
        if (bitmapRatio > targetRatio) {
            srcHeight = bitmap.height.toFloat()
            srcWidth = srcHeight * targetRatio
        } else {
            srcWidth = bitmap.width.toFloat()
            srcHeight = srcWidth / targetRatio
        }

        val left = (bitmap.width - srcWidth) / 2f
        val top = (bitmap.height - srcHeight) / 2f
        // The shader is evaluated in canvas space, so map to the real on-canvas rect.
        shader.setLocalMatrix(
            Matrix().apply {
                setRectToRect(
                    RectF(left, top, left + srcWidth, top + srcHeight),
                    RectF(target),
                    Matrix.ScaleToFit.FILL
                )
            }
        )
        return shader
    }

    private fun generateQrBitmap(content: String, size: Int, quietZone: Int = 4): Bitmap {
        val hints = mapOf(EncodeHintType.MARGIN to quietZone)
        val bitMatrix: BitMatrix = MultiFormatWriter().encode(
            content,
            BarcodeFormat.QR_CODE,
            size,
            size,
            hints
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

    // --- Formatting ----------------------------------------------------------

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

    /** "12 Agustus 2026" — used on the share card. */
    private fun formatDateLong(rawDate: String?): String {
        if (rawDate.isNullOrBlank()) return "-"
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val formatter = SimpleDateFormat("dd MMMM yyyy", Locale.forLanguageTag("id-ID"))
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

    /** "17.40" — used on the share card. */
    private fun formatTimeDot(rawTime: String?): String = formatTime(rawTime).replace(':', '.')

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