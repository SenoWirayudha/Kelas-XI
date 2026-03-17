package com.komputerkit.moview.ui.ticket

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import com.komputerkit.moview.MainActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.repository.MovieRepository
import com.google.android.material.tabs.TabLayoutMediator
import com.komputerkit.moview.databinding.ActivityTicketHistoryBinding
import com.komputerkit.moview.util.MovieActionsHelper
import kotlinx.coroutines.launch

class TicketHistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityTicketHistoryBinding
    private val viewModel: TicketHistoryViewModel by viewModels()
    private val movieRepository = MovieRepository()
    private val refreshHandler = Handler(Looper.getMainLooper())
    private val refreshRunnable = object : Runnable {
        override fun run() {
            loadTicketHistory()
            refreshHandler.postDelayed(this, AUTO_REFRESH_INTERVAL_MS)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTicketHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupClicks()
        setupTabs()
        observeViewModel()
        loadTicketHistory()
    }

    private fun setupClicks() {
        binding.btnBack.setOnClickListener { finish() }
    }

    private fun setupTabs() {
        binding.viewPager.adapter = TicketHistoryPagerAdapter(this)

        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            tab.text = when (position) {
                0 -> "Tiket Aktif"
                1 -> "Riwayat Transaksi"
                else -> ""
            }
        }.attach()

        val initialTab = intent.getIntExtra(EXTRA_INITIAL_TAB, 0)
        binding.viewPager.setCurrentItem(initialTab.coerceIn(0, 1), false)
    }

    private fun observeViewModel() {
        viewModel.errorMessage.observe(this) { message ->
            if (!message.isNullOrBlank()) {
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun loadTicketHistory() {
        val userId = getSharedPreferences("MoviewPrefs", MODE_PRIVATE).getInt("userId", 0)
        if (userId <= 0) {
            Toast.makeText(this, "User belum login.", Toast.LENGTH_SHORT).show()
            return
        }

        viewModel.loadTickets(userId)
    }

    override fun onResume() {
        super.onResume()
        loadTicketHistory()
        refreshHandler.postDelayed(refreshRunnable, AUTO_REFRESH_INTERVAL_MS)
    }

    override fun onPause() {
        super.onPause()
        refreshHandler.removeCallbacks(refreshRunnable)
    }

    fun onTicketActionClicked(item: TicketHistoryItem) {
        if (item.status == TicketStatus.ACTIVE && item.ticketCode.isNotBlank()) {
            val intent = Intent(this, TicketQrActivity::class.java).apply {
                putExtra(TicketQrActivity.EXTRA_ORDER_ID, item.orderId)
                putExtra(TicketQrActivity.EXTRA_TICKET_CODE, item.ticketCode)
            }
            startActivity(intent)
            return
        }

        if (item.movieId <= 0) {
            Toast.makeText(this, "Film tidak ditemukan.", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            val detailMovie = movieRepository.getMovieDetail(item.movieId)
            val movie = detailMovie ?: Movie(
                id = item.movieId,
                title = item.title,
                posterUrl = item.posterUrl,
                averageRating = null,
                genre = null,
                releaseYear = null,
                description = null
            )

            MovieActionsHelper.showMovieActionsBottomSheet(
                context = this@TicketHistoryActivity,
                movie = movie,
                lifecycleOwner = this@TicketHistoryActivity,
                isFromMovieDetail = false,
                onGoToFilm = { selectedMovie ->
                    navigateToMovieDetail(selectedMovie.id)
                },
                onLogFilm = { selectedMovie ->
                    navigateToLogFilm(selectedMovie.id)
                },
                onChangePoster = { selectedMovie ->
                    navigateToPosterBackdrop(selectedMovie.id)
                }
            )
        }
    }

    fun onTicketMovieClicked(item: TicketHistoryItem) {
        if (item.movieId <= 0) {
            Toast.makeText(this, "Film tidak ditemukan.", Toast.LENGTH_SHORT).show()
            return
        }

        navigateToMovieDetail(item.movieId)
    }

    private fun navigateToMovieDetail(movieId: Int) {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("navigate_to_movie_id", movieId)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
    }

    private fun navigateToLogFilm(movieId: Int) {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("navigate_to_log_film_movie_id", movieId)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
    }

    private fun navigateToPosterBackdrop(movieId: Int) {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("navigate_to_poster_backdrop_movie_id", movieId)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
    }

    companion object {
        const val EXTRA_INITIAL_TAB = "extra_initial_tab"
        const val TAB_ACTIVE = 0
        const val TAB_HISTORY = 1
        private const val AUTO_REFRESH_INTERVAL_MS = 15000L
    }
}
