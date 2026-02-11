package com.komputerkit.moview.ui.log

import android.app.DatePickerDialog
import android.os.Bundle
import android.text.Html
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.StyleSpan
import android.text.style.UnderlineSpan
import android.text.style.URLSpan
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentLogFilmBinding
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class LogFilmFragment : Fragment() {

    private var _binding: FragmentLogFilmBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: LogFilmViewModel by viewModels()
    private val args: LogFilmFragmentArgs by navArgs()
    
    private var currentRating = 0
    private var selectedDate: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLogFilmBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewModel.loadMovie(args.movieId, requireContext())
        
        // Handle edit mode (editing existing review)
        // Note: For rewatch, we DON'T use edit mode - user creates new log/review
        if (args.isEditMode) {
            binding.btnLogFilm.text = "EDIT REVIEW"
            args.existingReviewText?.let { htmlText ->
                // Convert HTML to Spannable for visual editing
                val spanned = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    Html.fromHtml(htmlText, Html.FROM_HTML_MODE_COMPACT)
                } else {
                    @Suppress("DEPRECATION")
                    Html.fromHtml(htmlText)
                }
                binding.etReview.setText(spanned)
            }
            if (args.existingRating > 0) {
                currentRating = args.existingRating
                updateStars(args.existingRating)
            }
            // Load watched date if available
            args.watchedDate?.let { watchedDate ->
                selectedDate = watchedDate
                // Format and display the date
                try {
                    val inputFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                    val outputFormat = java.text.SimpleDateFormat("MMM d", java.util.Locale.getDefault())
                    val date = inputFormat.parse(watchedDate)
                    if (date != null) {
                        binding.tvWatchedDate.text = outputFormat.format(date).uppercase()
                        binding.tvWatchedDate.visibility = View.VISIBLE
                    }
                } catch (e: Exception) {
                    android.util.Log.e("LogFilmFragment", "Error formatting watched date: ${e.message}")
                }
            }
        }
        
        setupObservers()
        setupClickListeners()
        setupStarRating()
    }
    
    private fun setupObservers() {
        viewModel.movie.observe(viewLifecycleOwner) { movie ->
            binding.tvTitle.text = movie.title
            binding.tvInfo.text = "${movie.releaseYear} • ${movie.genre}"
            
            Glide.with(this)
                .load(movie.posterUrl)
                .into(binding.ivPoster)
        }
        
        viewModel.isLiked.observe(viewLifecycleOwner) { isLiked ->
            updateLikedButton(isLiked)
        }
        
        // Icon watch state from ratings table
        viewModel.isWatched.observe(viewLifecycleOwner) { isWatched ->
            updateWatchedButton(isWatched)
        }
        
        // Label REWATCHED from diary count (watchCount > 0)
        viewModel.isRewatch.observe(viewLifecycleOwner) { isRewatch ->
            if (isRewatch && !args.isEditMode) {
                binding.tvWatchedLabel.text = "REWATCHED"
                binding.btnWatched.setCardBackgroundColor(
                    ContextCompat.getColor(requireContext(), R.color.teal_watched)
                )
            }
        }
        
        viewModel.rating.observe(viewLifecycleOwner) { rating ->
            updateStars(rating)
        }
        
        viewModel.saveSuccess.observe(viewLifecycleOwner) { success ->
            if (success == true) {
                Toast.makeText(requireContext(), "Rating saved!", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.cardPoster.setOnClickListener {
            viewModel.movie.value?.let { movie ->
                val action = LogFilmFragmentDirections.actionLogFilmToMovieDetail(movie.id)
                findNavController().navigate(action)
            }
        }
        
        binding.btnWatched.setOnClickListener {
            viewModel.toggleWatched()
        }
        
        binding.btnLiked.setOnClickListener {
            viewModel.toggleLike()
        }
        
        binding.btnToday.setOnClickListener {
            showDatePicker()
        }
        
        binding.btnBold.setOnClickListener {
            applyStyleSpan(android.graphics.Typeface.BOLD)
        }
        
        binding.btnItalic.setOnClickListener {
            applyStyleSpan(android.graphics.Typeface.ITALIC)
        }
        
        binding.btnUnderline.setOnClickListener {
            applyUnderlineSpan()
        }
        
        binding.btnLink.setOnClickListener {
            showAddLinkDialog()
        }
        
        binding.btnLogFilm.setOnClickListener {
            saveLog()
        }
    }
    
    private fun setupStarRating() {
        val stars = listOf(
            binding.star1,
            binding.star2,
            binding.star3,
            binding.star4,
            binding.star5
        )
        
        stars.forEachIndexed { index, star ->
            star.setOnClickListener {
                val rating = index + 1
                currentRating = rating
                viewModel.setRating(rating)
                updateStars(rating)
            }
        }
    }
    
    private fun updateStars(rating: Int) {
        val stars = listOf(
            binding.star1,
            binding.star2,
            binding.star3,
            binding.star4,
            binding.star5
        )
        
        stars.forEachIndexed { index, star ->
            if (index < rating) {
                star.setImageResource(R.drawable.ic_star_filled)
            } else {
                star.setImageResource(R.drawable.ic_star_outline)
            }
        }
    }
    
    private fun updateLikedButton(isLiked: Boolean) {
        if (isLiked) {
            binding.btnLiked.setCardBackgroundColor(
                ContextCompat.getColor(requireContext(), R.color.pink_like)
            )
            binding.ivLikedIcon.setImageResource(R.drawable.ic_heart)
            binding.ivLikedIcon.setColorFilter(
                ContextCompat.getColor(requireContext(), R.color.white)
            )
        } else {
            binding.btnLiked.setCardBackgroundColor(
                ContextCompat.getColor(requireContext(), R.color.dark_card)
            )
            binding.ivLikedIcon.setImageResource(R.drawable.ic_heart_outline)
            binding.ivLikedIcon.setColorFilter(
                ContextCompat.getColor(requireContext(), R.color.text_secondary)
            )
        }
    }
    
    private fun updateWatchedButton(isWatched: Boolean) {
        if (isWatched) {
            binding.tvWatchedLabel.text = "WATCHED"
            binding.btnWatched.setCardBackgroundColor(
                ContextCompat.getColor(requireContext(), R.color.teal_watched)
            )
        } else {
            binding.tvWatchedLabel.text = "WATCH"
            binding.btnWatched.setCardBackgroundColor(
                ContextCompat.getColor(requireContext(), R.color.dark_card)
            )
        }
    }
    
    private fun updateRewatchButton(isRewatch: Boolean) {
        if (isRewatch) {
            binding.tvWatchedLabel.text = "REWATCH"
        }
    }
    
    private fun showDatePicker() {
        val calendar = Calendar.getInstance()
        val datePickerDialog = DatePickerDialog(
            requireContext(),
            { _, year, month, dayOfMonth ->
                val selectedCalendar = Calendar.getInstance()
                selectedCalendar.set(year, month, dayOfMonth)
                
                val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                selectedDate = dateFormat.format(selectedCalendar.time)
                
                // Update button label
                val displayFormat = SimpleDateFormat("MMM d", Locale.US)
                val displayDate = displayFormat.format(selectedCalendar.time)
                binding.tvWatchedDate.text = displayDate.uppercase()
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        
        // Set max date to today
        datePickerDialog.datePicker.maxDate = System.currentTimeMillis()
        datePickerDialog.show()
    }
    
    private fun applyStyleSpan(style: Int) {
        val editText = binding.etReview
        val start = editText.selectionStart
        val end = editText.selectionEnd
        
        if (start == end) {
            Toast.makeText(requireContext(), "Please select text first", Toast.LENGTH_SHORT).show()
            return
        }
        
        val spannable = editText.text as? SpannableStringBuilder ?: SpannableStringBuilder(editText.text)
        
        // Check if style already exists
        val existingSpans = spannable.getSpans(start, end, StyleSpan::class.java)
        val hasStyle = existingSpans.any { it.style == style }
        
        if (hasStyle) {
            // Remove the style
            existingSpans.filter { it.style == style }.forEach { spannable.removeSpan(it) }
        } else {
            // Add the style
            spannable.setSpan(
                StyleSpan(style),
                start,
                end,
                Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        
        editText.setText(spannable)
        editText.setSelection(start, end)
    }
    
    private fun applyUnderlineSpan() {
        val editText = binding.etReview
        val start = editText.selectionStart
        val end = editText.selectionEnd
        
        if (start == end) {
            Toast.makeText(requireContext(), "Please select text first", Toast.LENGTH_SHORT).show()
            return
        }
        
        val spannable = editText.text as? SpannableStringBuilder ?: SpannableStringBuilder(editText.text)
        
        // Check if underline already exists
        val existingSpans = spannable.getSpans(start, end, UnderlineSpan::class.java)
        
        if (existingSpans.isNotEmpty()) {
            // Remove underline
            existingSpans.forEach { spannable.removeSpan(it) }
        } else {
            // Add underline
            spannable.setSpan(
                UnderlineSpan(),
                start,
                end,
                Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        
        editText.setText(spannable)
        editText.setSelection(start, end)
    }
    
    private fun showAddLinkDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_add_link, null)
        val etUrl = dialogView.findViewById<EditText>(R.id.et_url)
        val etTitle = dialogView.findViewById<EditText>(R.id.et_link_title)
        
        val editText = binding.etReview
        val start = editText.selectionStart
        val end = editText.selectionEnd
        
        // Pre-fill title with selected text if any
        if (start != end) {
            etTitle.setText(editText.text.substring(start, end))
        }
        
        AlertDialog.Builder(requireContext())
            .setTitle("Add Link")
            .setView(dialogView)
            .setPositiveButton("Insert") { _, _ ->
                val url = etUrl.text.toString().trim()
                var title = etTitle.text.toString().trim()
                
                if (url.isEmpty()) {
                    Toast.makeText(requireContext(), "Please enter URL", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                
                // Ensure URL has https:// prefix
                val fullUrl = if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    "https://$url"
                } else {
                    url
                }
                
                if (title.isEmpty()) {
                    title = fullUrl
                }
                
                val spannable = editText.text as? SpannableStringBuilder ?: SpannableStringBuilder(editText.text)
                
                if (start != end) {
                    // Replace selected text with link
                    spannable.replace(start, end, title)
                    spannable.setSpan(
                        URLSpan(fullUrl),
                        start,
                        start + title.length,
                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    )
                    editText.setText(spannable)
                    editText.setSelection(start + title.length)
                } else {
                    // Insert link at cursor position
                    spannable.insert(start, title)
                    spannable.setSpan(
                        URLSpan(fullUrl),
                        start,
                        start + title.length,
                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    )
                    editText.setText(spannable)
                    editText.setSelection(start + title.length)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun spannableToHtml(spannable: CharSequence): String {
        if (spannable !is Spanned) {
            return spannable.toString()
        }
        
        val html = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            Html.toHtml(spannable, Html.TO_HTML_PARAGRAPH_LINES_CONSECUTIVE)
        } else {
            @Suppress("DEPRECATION")
            Html.toHtml(spannable)
        }
        
        // Clean up extra HTML tags added by Android
        return html
            .replace("<p dir=\"ltr\">", "")
            .replace("</p>", "")
            .replace("\n", "")
            .trim()
    }
    
    private fun saveLog() {
        // Convert Spannable to HTML before saving
        val reviewHtml = spannableToHtml(binding.etReview.text ?: "")
        val containsSpoilers = binding.cbSpoilers.isChecked
        
        if (args.isEditMode) {
            if (args.reviewId > 0) {
                // Update existing review
                viewModel.updateReview(args.reviewId, reviewHtml, containsSpoilers, currentRating, selectedDate)
            } else {
                // Create new review from log entry
                viewModel.saveLog(reviewHtml, containsSpoilers, selectedDate, isRewatch = false)
            }
        } else {
            // Check if this is a rewatch (user already has diary entries)
            val isRewatch = viewModel.isRewatch.value == true
            
            // Create new log/review (or rewatch if already watched)
            viewModel.saveLog(reviewHtml, containsSpoilers, selectedDate, isRewatch = isRewatch)
        }
        
        // Give time for async save before closing
        binding.root.postDelayed({
            // Check if fragment is still attached to avoid crash
            if (isAdded && context != null) {
                val isRewatch = viewModel.isRewatch.value == true && !args.isEditMode
                val message = if (args.isEditMode && args.reviewId > 0) {
                    "Review updated successfully!"
                } else if (isRewatch) {
                    "Rewatch logged successfully!"
                } else {
                    "Review saved successfully!"
                }
                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
                findNavController().navigateUp()
            }
        }, 500)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
