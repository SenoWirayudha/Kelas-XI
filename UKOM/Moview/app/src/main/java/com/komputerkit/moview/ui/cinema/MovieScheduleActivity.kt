package com.komputerkit.moview.ui.cinema

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.databinding.ActivityMovieScheduleBinding
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.ui.cinema.adapter.CinemaScheduleAdapter
import com.komputerkit.moview.ui.cinema.adapter.DateTabAdapter
import com.komputerkit.moview.ui.cinema.model.*
import com.komputerkit.moview.util.ServerConfig
import kotlinx.coroutines.launch

class MovieScheduleActivity : AppCompatActivity() {

    private val logTag: String = "MovieScheduleActivity"

    private lateinit var binding: ActivityMovieScheduleBinding
    private lateinit var viewModel: MovieScheduleViewModel
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
    private var selectedTime: ShowTime? = null
    private var movieId = 0
    private var movieTrailerUrl = ""
    private var cities: List<String> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMovieScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)
        viewModel = ViewModelProvider(this)[MovieScheduleViewModel::class.java]

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
        Log.d(logTag, "onCreate() movieId=$movieId title='$movieTitle'")

        populateMovieInfo()
        updateBuyButton()  // start disabled
        if (movieId > 0) fetchMovieDetails(movieId)
        setupDates()
        setupCinemas()
        setupSearchFilter()
        setupClickListeners()
        observeViewModel()
        viewModel.loadCities()
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
        dateAdapter = DateTabAdapter(emptyList()) { pos ->
            clearSelectedSchedule()
            viewModel.setDateByIndex(pos)
        }
        binding.rvDates.layoutManager =
            LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.rvDates.adapter = dateAdapter
    }

    private fun setupCinemas() {
        cinemaAdapter = CinemaScheduleAdapter(emptyList()) { cinema, time ->
            selectedCinema = cinema
            selectedTime = time
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

    private fun clearSelectedSchedule() {
        selectedCinema = null
        selectedTime = null
        updateBuyButton()
    }

    private fun setupSearchFilter() {
        binding.etSearchCinema.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                // Explicit filtering is triggered by Filter button.
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener { finish() }
        binding.btnCityPicker.setOnClickListener { showCityBottomSheet() }
        binding.btnFilter.setOnClickListener { applyCinemaFilter() }

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
            val time = selectedTime?.time ?: cinema.showTimes.firstOrNull()?.time ?: "13:00"
            val dateStr = selectedDate?.let { "${it.day} ${it.month}" } ?: "Hari ini"

            val bookingData = BookingData(
                scheduleId = selectedTime?.scheduleId ?: 0,
                movieTitle = movieTitle,
                moviePosterUrl = moviePosterUrl,
                movieRating = movieRating,
                movieAgeRating = movieAgeRating,
                serviceName = cinema.serviceName,
                cinemaName = cinema.cinemaName,
                studioName = cinema.studioType,
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

    private fun observeViewModel() {
        viewModel.uiState.observe(this) { state ->
            Log.d(
                logTag,
                "observeState city=${state.city} loading=${state.isLoading} cinemas=${state.filteredCinemas.size} error=${state.error}"
            )
            selectedDate = state.selectedDate
            cities = state.availableCities

            if (state.dates.isNotEmpty()) {
                val selectedIndex = state.dates.indexOfFirst { it.isoDate == state.selectedDate?.isoDate }
                dateAdapter = DateTabAdapter(state.dates, if (selectedIndex >= 0) selectedIndex else 0) { pos ->
                    clearSelectedSchedule()
                    viewModel.setDateByIndex(pos)
                }
                binding.rvDates.adapter = dateAdapter
            }

            if (state.city.isNullOrBlank()) {
                binding.tvSelectedCity.text = "Pilih Kota"
                binding.tvSelectedCity.setTextColor(getColor(com.komputerkit.moview.R.color.text_secondary))
            } else {
                binding.tvSelectedCity.text = state.city
                binding.tvSelectedCity.setTextColor(getColor(com.komputerkit.moview.R.color.text_primary))
            }

            binding.tvCityRequired.visibility = if (state.city.isNullOrBlank()) View.VISIBLE else View.GONE
            binding.layoutScheduleContent.visibility = if (state.city.isNullOrBlank()) View.GONE else View.VISIBLE
            binding.progressSchedules.visibility = if (state.isLoading) View.VISIBLE else View.GONE

            val noData = !state.isLoading && state.city != null && state.error.isNullOrBlank() && state.filteredCinemas.isEmpty()
            if (!state.error.isNullOrBlank()) {
                binding.tvScheduleError.visibility = View.VISIBLE
                binding.tvScheduleError.text = state.error
                binding.tvScheduleError.setTextColor(getColor(com.komputerkit.moview.R.color.red))
                Log.e(logTag, "uiError='${state.error}' movieId=$movieId city=${state.city}")
            } else if (noData) {
                binding.tvScheduleError.visibility = View.VISIBLE
                binding.tvScheduleError.text = "Jadwal tidak ditemukan untuk kota/tanggal/filter ini"
                binding.tvScheduleError.setTextColor(getColor(com.komputerkit.moview.R.color.text_secondary))
                Log.w(logTag, "noDataState movieId=$movieId city=${state.city} query='${state.searchQuery}'")
            } else {
                binding.tvScheduleError.visibility = View.GONE
            }

            allCinemas = state.filteredCinemas
            cinemaAdapter.updateList(allCinemas)
            if (selectedTime != null) {
                val stillExists = allCinemas.any { cinema ->
                    cinema.showTimes.any { it.scheduleId == selectedTime?.scheduleId }
                }
                if (!stillExists) {
                    clearSelectedSchedule()
                }
            }
        }
    }

    private fun applyCinemaFilter() {
        val query = binding.etSearchCinema.text?.toString().orEmpty().trim()
        Log.d(logTag, "applyCinemaFilter() query='$query'")
        viewModel.setSearchQuery(query)
        if (query.isBlank()) {
            Toast.makeText(this, "Menampilkan semua bioskop", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showCityBottomSheet() {
        if (cities.isEmpty()) {
            binding.tvScheduleError.visibility = View.VISIBLE
            binding.tvScheduleError.text = "Daftar kota belum tersedia, coba lagi"
            return
        }

        val dialog = BottomSheetDialog(this)
        val container = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(32, 24, 32, 24)
        }

        val title = android.widget.TextView(this).apply {
            text = "Pilih Kota"
            textSize = 16f
            setTextColor(getColor(com.komputerkit.moview.R.color.text_primary))
            setPadding(0, 0, 0, 12)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        container.addView(title)

        cities.forEach { city ->
            val item = android.widget.TextView(this).apply {
                text = city.toString().trim()
                textSize = 14f
                setTextColor(getColor(com.komputerkit.moview.R.color.text_primary))
                setPadding(8, 20, 8, 20)
                setOnClickListener {
                    val selectedCity = city.toString().trim()
                    clearSelectedSchedule()
                    viewModel.setCity(selectedCity.toString())
                    Log.d(logTag, "citySelected=$selectedCity -> loadSchedules(movieId=$movieId)")
                    viewModel.loadSchedules(movieId)
                    dialog.dismiss()
                }
            }
            container.addView(item)
        }

        dialog.setContentView(container)
        dialog.show()
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
