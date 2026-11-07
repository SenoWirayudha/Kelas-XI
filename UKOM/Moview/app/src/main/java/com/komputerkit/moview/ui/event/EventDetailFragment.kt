package com.komputerkit.moview.ui.event

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.os.Bundle
import android.text.TextUtils
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.Interpolator
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.EventDetail
import com.komputerkit.moview.data.model.EventSession
import com.komputerkit.moview.ui.cinema.model.ShowDate
import com.komputerkit.moview.ui.cinema.adapter.DateTabAdapter
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.databinding.FragmentEventDetailBinding
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/** Event detail: banner, info, date filter, sessions and the buy bar. */
class EventDetailFragment : Fragment() {

    private var _binding: FragmentEventDetailBinding? = null
    private val binding get() = _binding!!

    private val args: EventDetailFragmentArgs by navArgs()
    private val repository = MovieRepository()

    private lateinit var sessionAdapter: EventSessionAdapter

    private var detail: EventDetail? = null
    private var selectedDate: String? = null
    private var selectedSession: EventSession? = null
    private var dateAdapter: DateTabAdapter? = null
    private var bottomBarShown = false
    private var spacerAnimator: ValueAnimator? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEventDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.btnBuy.setOnClickListener { buyTicket() }
        binding.scroll.clipToPadding = true
        binding.btnRetry.setOnClickListener { loadDetail() }

        sessionAdapter = EventSessionAdapter { session -> toggleSession(session) }
        binding.rvSessions.layoutManager = LinearLayoutManager(requireContext())
        binding.rvSessions.adapter = sessionAdapter

        loadDetail()
    }

    private fun loadDetail() {
        binding.progressBar.visibility = View.VISIBLE
        binding.layoutError.visibility = View.GONE
        binding.scroll.visibility = View.INVISIBLE

        lifecycleScope.launch {
            val data = repository.getEventDetail(args.eventId)
            if (_binding == null) return@launch

            binding.progressBar.visibility = View.GONE

            if (data == null) {
                // Show the retry state instead of crashing on a failed request.
                binding.layoutError.visibility = View.VISIBLE
                return@launch
            }

            binding.scroll.visibility = View.VISIBLE

            detail = data
            binding.tvTitle.text = data.title
            binding.tvDescription.text = data.description.orEmpty()
            setupDescriptionToggle(data.description.orEmpty())
            binding.tvDateRange.text = "${formatLong(data.startDate)} - ${formatLong(data.endDate)}"
            binding.tvCinema.text = data.cinemaName.orEmpty()

            // Same wording as the event card; hidden once sales are open.
            val saleNotice = if (data.salesOpen) null else EventCardAdapter.formatSaleStart(data.saleStartsAt)
            binding.tvSaleBanner.text = saleNotice.orEmpty()
            binding.tvSaleBanner.visibility = if (saleNotice == null) View.GONE else View.VISIBLE

            Glide.with(requireContext()).load(data.bannerUrl).centerCrop().into(binding.ivBanner)

            buildDateBoxes(data)
        }
    }

    /** Shows "Show"/"Hide" only when the description really overflows 3 lines. */
    private fun setupDescriptionToggle(text: String) {
        var expanded = false
        binding.tvDescription.maxLines = 3
        binding.tvDescription.ellipsize = TextUtils.TruncateAt.END
        binding.tvDescToggle.text = "Show"
        binding.tvDescToggle.visibility = View.GONE

        binding.tvDescription.post {
            if (_binding == null) return@post
            val layout = binding.tvDescription.layout ?: return@post
            val overflows = layout.lineCount > 3 ||
                (layout.lineCount == 3 && layout.getEllipsisCount(2) > 0)
            binding.tvDescToggle.visibility = if (overflows) View.VISIBLE else View.GONE
        }

        binding.tvDescToggle.setOnClickListener {
            expanded = !expanded
            binding.tvDescription.maxLines = if (expanded) Int.MAX_VALUE else 3
            binding.tvDescription.ellipsize = if (expanded) null else TextUtils.TruncateAt.END
            binding.tvDescToggle.text = if (expanded) "Hide" else "Show"
        }
    }

    /** Dates come from the event range; the first date that has a session is selected. */
    private fun buildDateBoxes(event: EventDetail) {
        val sessionsByDate = event.sessions.groupBy { it.startsAt.take(10) }
        val start = parseDate(event.startDate) ?: return
        val end = parseDate(event.endDate) ?: return

        val cursor = start.clone() as Calendar
        val dates = mutableListOf<ShowDate>()
        while (!cursor.after(end) && dates.size < 60) {
            dates.add(
                ShowDate(
                    day = cursor.get(Calendar.DAY_OF_MONTH),
                    month = SimpleDateFormat("MMM", Locale("id", "ID")).format(cursor.time),
                    label = SimpleDateFormat("EEE", Locale("id", "ID"))
                        .format(cursor.time).uppercase(Locale("id", "ID")),
                    isoDate = formatIso(cursor)
                )
            )
            cursor.add(Calendar.DAY_OF_MONTH, 1)
        }

        if (dates.isEmpty()) return

        val defaultIndex = dates.indexOfFirst { sessionsByDate.containsKey(it.isoDate) }
            .takeIf { it >= 0 } ?: 0
        selectedDate = dates[defaultIndex].isoDate

        val adapter = DateTabAdapter(dates, defaultIndex) { position ->
            selectedDate = dates[position].isoDate
            showSessionsForSelectedDate()
        }
        dateAdapter = adapter
        binding.rvDates.layoutManager = LinearLayoutManager(
            requireContext(), LinearLayoutManager.HORIZONTAL, false
        )
        binding.rvDates.adapter = adapter

        showSessionsForSelectedDate()
    }

    private fun showSessionsForSelectedDate() {
        val date = selectedDate
        val sessions = detail?.sessions?.filter { it.startsAt.take(10) == date }.orEmpty()
        sessionAdapter.submitList(sessions)

        selectedSession = null
        hideBottomBar()
        sessionAdapter.setSelected(-1)

        binding.tvEmpty.visibility = if (sessions.isEmpty()) View.VISIBLE else View.GONE
    }

    /**
     * Re-checks the session on the server (WIB clock) before opening the existing seat flow.
     * The seat picker works off a schedule id, which festival sessions already are.
     */
    private fun buyTicket() {
        val session = selectedSession ?: return
        val event = detail ?: return

        binding.btnBuy.isEnabled = false
        lifecycleScope.launch {
            val check = repository.getEventSessionStatus(session.id)
            if (_binding == null) return@launch
            binding.btnBuy.isEnabled = true

            if (check == null) {
                android.widget.Toast.makeText(
                    requireContext(), "Gagal memeriksa status sesi.", android.widget.Toast.LENGTH_SHORT
                ).show()
                loadDetail()
                return@launch
            }

            if (!check.tersedia) {
                val label = when (check.status) {
                    EventSessionAdapter.STATUS_SOLD_OUT -> "Sold out"
                    EventSessionAdapter.STATUS_NOT_OPEN -> "Belum Dibuka"
                    else -> "Selesai"
                }
                android.widget.Toast.makeText(
                    requireContext(), "Sesi tidak tersedia: $label", android.widget.Toast.LENGTH_SHORT
                ).show()
                loadDetail()
                return@launch
            }

            if (session.ageRating?.trim() == "21+") {
                showAgeWarning { openSeatPicker(session, event) }
            } else {
                openSeatPicker(session, event)
            }
        }
    }

    /**
     * 21+ sessions need an ID check at the door. Shown every time the buyer proceeds;
     * cancelling keeps the session selected.
     */
    private fun showAgeWarning(onConfirm: () -> Unit) {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Film 21+")
            .setMessage(
                "Akan ada pengecekan KTP sebelum masuk teater. Pastikan kamu berusia " +
                    "minimal 21 tahun dan membawa KTP/identitas asli."
            )
            .setNegativeButton("Batal", null)
            .setPositiveButton("Saya Mengerti") { _, _ -> onConfirm() }
            .show()
    }

    /** Reuses the existing seat-selection flow with this session's schedule id. */
    private fun openSeatPicker(session: EventSession, event: EventDetail) {
        val firstFilm = session.films.firstOrNull()
        val booking = com.komputerkit.moview.ui.cinema.model.BookingData(
            scheduleId = session.id,
            movieTitle = session.sessionTitle ?: firstFilm?.title ?: event.title,
            moviePosterUrl = session.posterUrl ?: firstFilm?.posterUrl.orEmpty(),
            movieRating = 0.0,
            movieAgeRating = session.ageRating ?: "SU",
            cinemaName = event.cinemaName.orEmpty(),
            studioName = "",
            studioType = "",
            showDate = formatShort(session.startsAt),
            showTime = formatTime(session.startsAt),
            ticketPrice = (session.minPrice ?: 0.0).toInt()
        )

        val intent = android.content.Intent(
            requireContext(), com.komputerkit.moview.ui.cinema.SeatSelectionActivity::class.java
        ).apply {
            putExtra(com.komputerkit.moview.ui.cinema.SeatSelectionActivity.EXTRA_BOOKING, booking)
        }
        startActivity(intent)
    }

    /** "HH:mm" from the session timestamp (the seat/order screens show this verbatim). */
    private fun formatTime(dateTime: String): String = try {
        val date = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).parse(dateTime)
        SimpleDateFormat("HH:mm", Locale.US).format(date!!)
    } catch (_: Exception) {
        if (dateTime.length >= 16) dateTime.substring(11, 16) else dateTime
    }

    private fun formatShort(dateTime: String): String = try {
        val date = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).parse(dateTime)
        SimpleDateFormat("d MMM", Locale("id", "ID")).format(date!!)
    } catch (_: Exception) {
        dateTime.take(10)
    }

    /** Only one session at a time; tapping the same one clears it. */
    private fun toggleSession(session: EventSession) {
        val wasShown = bottomBarShown
        selectedSession = if (selectedSession?.id == session.id) null else session
        val current = selectedSession
        sessionAdapter.setSelected(current?.id ?: -1)

        if (current == null) {
            hideBottomBar()
            return
        }

        val title = "1 Ticket Selected"
        val price = EventSessionAdapter.formatRange(current.minPrice, current.minPrice)

        if (wasShown) {
            // Bar is already on screen: only the texts swap, with a crossfade.
            crossfadeBottomBar(title, price)
        } else {
            binding.tvTicketSelected.text = title
            binding.tvBottomPrice.text = price
            binding.tvTicketSelected.alpha = 1f
            binding.tvBottomPrice.alpha = 1f
            showBottomBar()
        }
    }

    // --- Buy bar animation (same 300ms decelerate spec used across the app) ---

    private fun showBottomBar() {
        val bar = binding.layoutBottomBar
        bar.animate().cancel()
        bar.visibility = View.VISIBLE
        // Invisible until the post-layout pass positions it below the screen.
        bar.alpha = 0f

        bar.post {
            if (_binding == null) return@post
            // Deselected before the first layout pass: undo the temporary visibility.
            if (!bottomBarShown) {
                bar.visibility = View.GONE
                return@post
            }
            val height = bar.height
            if (height <= 0) {
                bar.alpha = 1f
                return@post
            }

            bar.translationY = height.toFloat()
            bar.alpha = 0f
            bar.animate()
                .translationY(0f)
                .alpha(1f)
                .setDuration(BAR_DURATION)
                .setInterpolator(DecelerateInterpolator())
                .start()

            animateBottomSpacer(height, DecelerateInterpolator())
        }

        bottomBarShown = true
    }

    private fun hideBottomBar() {
        val bar = binding.layoutBottomBar
        bar.animate().cancel()
        bottomBarShown = false

        if (bar.visibility != View.VISIBLE) {
            animateBottomSpacer(0, DecelerateInterpolator())
            return
        }

        bar.animate()
            .translationY(bar.height.toFloat())
            .alpha(0f)
            .setDuration(BAR_DURATION)
            .setInterpolator(AccelerateInterpolator())
            .withEndAction {
                if (_binding == null || bottomBarShown) return@withEndAction
                bar.visibility = View.GONE
                bar.translationY = 0f
                bar.alpha = 1f
            }
            .start()

        animateBottomSpacer(0, AccelerateInterpolator())
    }

    /** Keeps the list's bottom padding in sync with the bar so nothing jumps. */
    private fun animateBottomSpacer(target: Int, interpolator: Interpolator) {
        val scroll = binding.scroll
        spacerAnimator?.cancel()
        val from = scroll.paddingBottom
        if (from == target) {
            scroll.clipToPadding = target == 0
            return
        }

        scroll.clipToPadding = false
        spacerAnimator = ValueAnimator.ofInt(from, target).apply {
            duration = BAR_DURATION
            this.interpolator = interpolator
            addUpdateListener { animator ->
                if (_binding == null) return@addUpdateListener
                scroll.setPadding(
                    scroll.paddingLeft,
                    scroll.paddingTop,
                    scroll.paddingRight,
                    animator.animatedValue as Int
                )
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    if (_binding != null) scroll.clipToPadding = target == 0
                }
            })
            start()
        }
    }

    private fun crossfadeBottomBar(title: String, price: String) {
        val half = CROSSFADE_DURATION / 2
        binding.tvTicketSelected.animate().cancel()
        binding.tvBottomPrice.animate().cancel()

        binding.tvTicketSelected.animate()
            .alpha(0f)
            .setDuration(half)
            .start()

        binding.tvBottomPrice.animate()
            .alpha(0f)
            .setDuration(half)
            .withEndAction {
                if (_binding == null) return@withEndAction
                binding.tvTicketSelected.text = title
                binding.tvBottomPrice.text = price
                binding.tvTicketSelected.animate().alpha(1f).setDuration(half).start()
                binding.tvBottomPrice.animate().alpha(1f).setDuration(half).start()
            }
            .start()
    }

    private fun parseDate(iso: String): Calendar? = try {
        val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(iso)
        Calendar.getInstance().apply { time = date }
    } catch (_: Exception) {
        null
    }

    private fun formatIso(calendar: Calendar): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(calendar.time)

    private fun formatLong(iso: String): String = try {
        val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(iso)
        SimpleDateFormat("d MMMM yyyy", Locale("id", "ID")).format(date!!)
    } catch (_: Exception) {
        iso
    }

    override fun onDestroyView() {
        binding.layoutBottomBar.animate().cancel()
        binding.tvTicketSelected.animate().cancel()
        binding.tvBottomPrice.animate().cancel()
        spacerAnimator?.cancel()
        spacerAnimator = null
        super.onDestroyView()
        _binding = null
    }

    private companion object {
        /** Same motion spec as the rest of the app: short, decelerating. */
        const val BAR_DURATION = 300L
        const val CROSSFADE_DURATION = 180L
    }
}