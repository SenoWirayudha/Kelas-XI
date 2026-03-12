package com.komputerkit.moview.ui.cinema

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.komputerkit.moview.databinding.ActivityMovieScheduleBinding
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.ui.cinema.adapter.CinemaScheduleAdapter
import com.komputerkit.moview.ui.cinema.adapter.DateTabAdapter
import com.komputerkit.moview.ui.cinema.model.*
import com.komputerkit.moview.util.ServerConfig
import java.util.Calendar
import kotlinx.coroutines.launch

class MovieScheduleActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMovieScheduleBinding
    private lateinit var dateAdapter: DateTabAdapter
    private lateinit var cinemaAdapter: CinemaScheduleAdapter

    private var allCinemas: List<CinemaSchedule> = emptyList()
    private var movieTitle: String = ""
    private var moviePosterUrl: String = ""
    private var movieBackdropUrl: String = ""
    private var movieRating: Double = 0.0
    private var movieAgeRating: String = "SU"
    private var movieGenre: String = ""
    private var movieDuration: String = ""
    private var movieDirector: String = ""
    private var selectedDate: ShowDate? = null
    private var selectedCinema: CinemaSchedule? = null
    private var selectedTime: String? = null
    private var movieId = 0
    private var movieTrailerUrl = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMovieScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Read intent extras
        movieTitle = intent.getStringExtra(EXTRA_MOVIE_TITLE) ?: "HOPPERS"
        moviePosterUrl = intent.getStringExtra(EXTRA_POSTER_URL) ?: ""
        movieBackdropUrl = intent.getStringExtra(EXTRA_BACKDROP_URL) ?: ""
        movieRating = intent.getDoubleExtra(EXTRA_RATING, 0.0)
        movieAgeRating = intent.getStringExtra(EXTRA_AGE_RATING) ?: "SU"
        movieGenre = intent.getStringExtra(EXTRA_GENRE) ?: ""
        movieDuration = intent.getStringExtra(EXTRA_DURATION) ?: ""
        movieDirector = intent.getStringExtra(EXTRA_DIRECTOR) ?: ""
        movieId = intent.getIntExtra(EXTRA_MOVIE_ID, 0)

        populateMovieInfo()
        updateBuyButton()  // start disabled
        if (movieId > 0) fetchMovieDetails(movieId)
        setupDates()
        setupCinemas()
        setupSearchFilter()
        setupClickListeners()
    }

    private fun populateMovieInfo() {
        binding.tvMovieTitle.text = movieTitle
        binding.tvGenre.text = movieGenre
        binding.tvDuration.text = movieDuration
        binding.tvDirector.text = movieDirector
        binding.tvAgeRating.text = movieAgeRating
        if (movieRating > 0) {
            binding.tvRating.text = String.format("%.1f", movieRating)
            binding.tvStars.text = ratingToStars(movieRating)
        }
        binding.btnTrailer.visibility = View.GONE

        if (moviePosterUrl.isNotBlank()) {
            Glide.with(this).load(ServerConfig.fixUrl(moviePosterUrl)).into(binding.ivPoster)
        }
        if (movieBackdropUrl.isNotBlank()) {
            Glide.with(this).load(ServerConfig.fixUrl(movieBackdropUrl)).into(binding.ivBackdrop)
        }
    }

    private fun ratingToStars(rating: Double): String {
        val filled = rating.toInt().coerceIn(0, 5)
        val half = if (rating - filled.toDouble() >= 0.5) 1 else 0
        val empty = 5 - filled - half
        return "★".repeat(filled) + (if (half == 1) "⭑" else "") + "☆".repeat(empty)
    }

    private fun setupDates() {
        val cal = Calendar.getInstance()
        val monthNames = listOf("Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des")
        val dayNames = listOf("MIN","SEN","SEL","RAB","KAM","JUM","SAB")

        val dates = (0..6).map { i ->
            if (i > 0) cal.add(Calendar.DAY_OF_YEAR, 1)
            ShowDate(
                day = cal.get(Calendar.DAY_OF_MONTH),
                month = monthNames[cal.get(Calendar.MONTH)],
                label = if (i == 0) "Hari ini" else dayNames[cal.get(Calendar.DAY_OF_WEEK) - 1]
            )
        }
        selectedDate = dates.first()

        dateAdapter = DateTabAdapter(dates) { pos ->
            selectedDate = dates[pos]
        }
        binding.rvDates.layoutManager =
            LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.rvDates.adapter = dateAdapter
    }

    private fun setupCinemas() {
        allCinemas = buildSampleCinemas()

        cinemaAdapter = CinemaScheduleAdapter(allCinemas) { cinema, time ->
            selectedCinema = cinema
            selectedTime = time.time
            updateBuyButton()
        }
        binding.rvCinemas.layoutManager = LinearLayoutManager(this)
        binding.rvCinemas.adapter = cinemaAdapter
    }

    private fun updateBuyButton() {
        val hasSelection = selectedCinema != null && selectedTime != null
        binding.btnBuyTicket.isEnabled = hasSelection
        binding.btnBuyTicket.alpha = if (hasSelection) 1f else 0.45f
    }

    private fun setupSearchFilter() {
        binding.etSearchCinema.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                val query = s.toString().trim().lowercase()
                val filtered = if (query.isEmpty()) allCinemas
                else allCinemas.filter { it.cinemaName.lowercase().contains(query) }
                cinemaAdapter.updateList(filtered)
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener { finish() }

        binding.ivPoster.setOnClickListener {
            if (movieId > 0) {
                val intent = Intent(this, com.komputerkit.moview.MainActivity::class.java).apply {
                    putExtra("navigate_to_movie_id", movieId)
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                }
                startActivity(intent)
            }
        }

        binding.btnTrailer.setOnClickListener {
            if (movieTrailerUrl.isNotBlank()) {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(movieTrailerUrl)))
            }
        }

        binding.btnBuyTicket.setOnClickListener {
            val cinema = selectedCinema ?: allCinemas.firstOrNull() ?: return@setOnClickListener
            val time = selectedTime ?: cinema.showTimes.firstOrNull()?.time ?: "13:00"
            val dateStr = selectedDate?.let { "${it.day} ${it.month}" } ?: "Hari ini"

            val bookingData = BookingData(
                movieTitle = movieTitle,
                moviePosterUrl = moviePosterUrl,
                movieRating = movieRating,
                movieAgeRating = movieAgeRating,
                cinemaName = cinema.cinemaName,
                studioName = "STUDIO 1",
                studioType = cinema.studioType,
                showDate = dateStr,
                showTime = time,
                ticketPrice = extractPrice(cinema.priceRange)
            )
            val intent = Intent(this, SeatSelectionActivity::class.java)
            intent.putExtra(SeatSelectionActivity.EXTRA_BOOKING, bookingData)
            startActivity(intent)
        }
    }

    private fun fetchMovieDetails(movieId: Int) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.movieApiService.getMovieDetail(movieId)
                if (response.success && response.data != null) {
                    val dto = response.data
                    val backdropPath = dto.backdrop_path
                    if (!backdropPath.isNullOrBlank()) {
                        Glide.with(this@MovieScheduleActivity)
                            .load(ServerConfig.fixUrl(backdropPath))
                            .into(binding.ivBackdrop)
                    }
                    if (!dto.duration.isNullOrBlank()) binding.tvDuration.text = dto.duration
                    val director = dto.directors?.firstOrNull()?.name
                    if (!director.isNullOrBlank()) binding.tvDirector.text = director
                    val trailer = dto.trailer_url
                    if (!trailer.isNullOrBlank()) {
                        movieTrailerUrl = trailer
                        binding.btnTrailer.visibility = View.VISIBLE
                    }
                    val avgRating = dto.statistics?.average_rating?.toDouble() ?: 0.0
                    if (avgRating > 0) {
                        movieRating = avgRating
                        binding.tvRating.text = String.format("%.1f", avgRating)
                        binding.tvStars.text = ratingToStars(avgRating)
                    }
                }
            } catch (_: Exception) {}
        }
    }

    private fun extractPrice(priceRange: String): Int {
        return try {
            val first = priceRange.replace("Rp","").replace(".","")
                .split("-").first().trim().toInt()
            first
        } catch (e: Exception) { 35000 }
    }

    private fun buildSampleCinemas(): List<CinemaSchedule> = listOf(
        CinemaSchedule(
            cinemaId = "1", cinemaName = "BG JUNCTION CGV",
            studioType = "REGULAR 2D", priceRange = "Rp35.000 - Rp40.000",
            brand = CinemaBrand.CGV,
            showTimes = listOf(ShowTime("10:00"), ShowTime("13:20"), ShowTime("16:40"), ShowTime("19:55"))
        ),
        CinemaSchedule(
            cinemaId = "2", cinemaName = "CIPLAZ SIDOARJO XXI",
            studioType = "REGULAR 2D", priceRange = "Rp35.000 - Rp40.000",
            brand = CinemaBrand.XXI,
            showTimes = listOf(ShowTime("09:30"), ShowTime("12:00"), ShowTime("13:15"), ShowTime("15:45"), ShowTime("18:30"))
        ),
        CinemaSchedule(
            cinemaId = "3", cinemaName = "DELTA PLAZA XXI",
            studioType = "REGULAR 2D", priceRange = "Rp35.000 - Rp40.000",
            brand = CinemaBrand.XXI,
            showTimes = listOf(ShowTime("11:00"), ShowTime("14:15"), ShowTime("17:30"), ShowTime("20:45"))
        ),
        CinemaSchedule(
            cinemaId = "4", cinemaName = "PAKUWON MALL CGV",
            studioType = "PREMIERE", priceRange = "Rp60.000 - Rp80.000",
            brand = CinemaBrand.CGV,
            showTimes = listOf(ShowTime("10:30"), ShowTime("13:45"), ShowTime("17:00"), ShowTime("20:15"))
        )
    )

    companion object {
        const val EXTRA_MOVIE_TITLE = "extra_movie_title"
        const val EXTRA_POSTER_URL = "extra_poster_url"
        const val EXTRA_BACKDROP_URL = "extra_backdrop_url"
        const val EXTRA_RATING = "extra_rating"
        const val EXTRA_AGE_RATING = "extra_age_rating"
        const val EXTRA_GENRE = "extra_genre"
        const val EXTRA_DURATION = "extra_duration"
        const val EXTRA_DIRECTOR = "extra_director"
        const val EXTRA_MOVIE_ID = "extra_movie_id"
    }
}
