package com.komputerkit.moview.ui.log

import android.app.DatePickerDialog
import android.graphics.Color
import android.os.Bundle
import android.text.Html
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.StyleSpan
import android.text.style.UnderlineSpan
import android.text.style.URLSpan
import android.util.TypedValue
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.LinearLayout
import androidx.core.view.doOnLayout
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.komputerkit.moview.R
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.databinding.FragmentLogFilmBinding
import com.komputerkit.moview.util.loadPoster
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class LogFilmFragment : Fragment() {

    private var _binding: FragmentLogFilmBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: LogFilmViewModel by viewModels()
    private val args: LogFilmFragmentArgs by navArgs()
    
    private var currentRating = 0f
    private var selectedDate: String? = null
    private var isFocusMode = false
    private var scrollListener: ViewTreeObserver.OnScrollChangedListener? = null

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
        
        setupAppBar()
        setupFocusMode()
        setupKeyboardInset()
        
        if (args.isEditMode) {
            args.existingReviewText?.let { htmlText ->
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
                binding.starRating.rating = args.existingRating
            }
            args.watchedDate?.let { watchedDate ->
                selectedDate = watchedDate
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
    
    private fun setupAppBar() {
        val tv = TypedValue()
        val toolbarHeight = if (requireContext().theme.resolveAttribute(android.R.attr.actionBarSize, tv, true)) {
            TypedValue.complexToDimensionPixelSize(tv.data, resources.displayMetrics)
        } else {
            56 * resources.displayMetrics.density.toInt()
        }
        scrollListener = ViewTreeObserver.OnScrollChangedListener {
            val b = _binding ?: return@OnScrollChangedListener
            if (!isFocusMode) {
                val scrollY = b.scrollView.scrollY
                val titleAlpha = (scrollY.toFloat() / toolbarHeight).coerceIn(0f, 1f)
                b.tvToolbarTitle.alpha = titleAlpha
            }
        }
        binding.scrollView.viewTreeObserver.addOnScrollChangedListener(scrollListener)
        binding.btnBack.setOnClickListener {
            if (!isFocusMode) {
                findNavController().navigateUp()
            }
        }
        binding.btnPost.setOnClickListener {
            saveLog()
        }
    }
    
    private var backCallback: androidx.activity.OnBackPressedCallback? = null

    private fun setupFocusMode() {
        binding.etReview.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus && !isFocusMode) {
                enterFocusMode()
            }
        }
        binding.etReview.setOnClickListener {
            android.util.Log.d("LogFilm", "etReview CLICKED, isFocusMode=$isFocusMode")
            if (!isFocusMode) {
                enterFocusMode()
            }
        }
        binding.btnFocusBack.setOnClickListener {
            android.util.Log.d("LogFilm", "btn_focus_back CLICKED, isFocusMode=$isFocusMode")
            if (isFocusMode) {
                exitFocusMode()
            }
        }
        binding.focusBackBar.setOnClickListener {
            android.util.Log.d("LogFilm", "focus_back_bar CLICKED, isFocusMode=$isFocusMode")
            if (isFocusMode) {
                exitFocusMode()
            }
        }
        backCallback = object : androidx.activity.OnBackPressedCallback(false) {
            override fun handleOnBackPressed() {
                exitFocusMode()
            }
        }
        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner, backCallback!!)
    }
    
    private fun enterFocusMode() {
        android.util.Log.d("LogFilm", ">>> enterFocusMode() called")
        isFocusMode = true
        backCallback?.isEnabled = true
        val duration = 200L
        val density = resources.displayMetrics.density

        binding.btnPost.animate().alpha(0f).setDuration(duration / 2).withEndAction {
            binding.btnPost.visibility = View.INVISIBLE
            binding.btnPost.alpha = 1f
        }.start()

        listOf(
            binding.cardPoster, binding.tvTitle, binding.tvInfo,
            binding.layoutStars, binding.tvRateLabel, binding.layoutActions,
            binding.layoutReviewHeader
        ).forEach { v ->
            v.animate()
                .alpha(0f)
                .translationY(-15f * density)
                .setDuration(duration)
                .withEndAction { v.visibility = View.GONE; v.translationY = 0f }
                .start()
        }

        binding.appBar.animate()
            .alpha(0f)
            .translationY(-binding.appBar.height.toFloat())
            .setDuration(duration)
            .withEndAction {
                binding.appBar.visibility = View.GONE
                binding.appBar.alpha = 1f
                binding.appBar.translationY = 0f
            }.start()

        binding.focusBackBar.alpha = 0f
        binding.focusBackBar.visibility = View.VISIBLE
        binding.focusBackBar.animate().alpha(1f).setDuration(duration).start()

        binding.scrollView.post {
            val scrollContent = binding.scrollView.getChildAt(0) as? ViewGroup
            val cardInnerLayout = (binding.cardReview.getChildAt(0) as? ViewGroup)

            val actionBarSizePx = resources.getDimensionPixelSize(
                resources.getIdentifier("action_bar_size", "dimen", "android").takeIf { it != 0 }
                    ?: return@post
            )

            (binding.cardReview.layoutParams as ViewGroup.MarginLayoutParams).let {
                it.topMargin = 0; it.bottomMargin = 0; it.leftMargin = 0; it.rightMargin = 0
            }

            scrollContent?.let { sc ->
                sc.layoutParams = sc.layoutParams.apply { height = ViewGroup.LayoutParams.MATCH_PARENT }
                sc.setPadding(sc.paddingLeft, actionBarSizePx, sc.paddingRight, sc.paddingBottom)
            }
            binding.cardReview.layoutParams = binding.cardReview.layoutParams.apply { height = ViewGroup.LayoutParams.MATCH_PARENT }
            cardInnerLayout?.layoutParams = cardInnerLayout?.layoutParams?.apply { height = ViewGroup.LayoutParams.MATCH_PARENT }

            (binding.etReview.layoutParams as? LinearLayout.LayoutParams)?.let {
                it.height = 0
                it.weight = 1f
                binding.etReview.minimumHeight = 0
                binding.etReview.requestLayout()
            }
        }

        binding.etReview.postDelayed({
            if (!isFocusMode) return@postDelayed
            binding.etReview.requestFocus()
            val imm = requireContext().getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showSoftInput(binding.etReview, InputMethodManager.SHOW_IMPLICIT)
        }, 250L)
    }
    
    private fun exitFocusMode() {
        android.util.Log.d("LogFilm", "<<< exitFocusMode() called")
        isFocusMode = false
        backCallback?.isEnabled = false
        val duration = 200L
        val density = resources.displayMetrics.density

        val imm = requireContext().getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.hideSoftInputFromWindow(binding.etReview.windowToken, 0)
        binding.etReview.clearFocus()

        binding.btnPost.visibility = View.VISIBLE
        binding.btnPost.alpha = 0f
        binding.btnPost.animate().alpha(1f).setDuration(duration).start()

        val scrollContent = binding.scrollView.getChildAt(0) as? ViewGroup
        val cardInnerLayout = (binding.cardReview.getChildAt(0) as? ViewGroup)

        scrollContent?.let { sc ->
            sc.layoutParams = sc.layoutParams.apply { height = ViewGroup.LayoutParams.WRAP_CONTENT }
            sc.setPadding(sc.paddingLeft, 0, sc.paddingRight, sc.paddingBottom)
        }
        binding.cardReview.layoutParams = binding.cardReview.layoutParams.apply { height = ViewGroup.LayoutParams.WRAP_CONTENT }
        cardInnerLayout?.layoutParams = cardInnerLayout?.layoutParams?.apply { height = ViewGroup.LayoutParams.WRAP_CONTENT }

        (binding.etReview.layoutParams as? LinearLayout.LayoutParams)?.let {
            it.height = ViewGroup.LayoutParams.WRAP_CONTENT
            it.weight = 0f
        }
        binding.etReview.minimumHeight = (150 * density).toInt()

        val cardMargins = binding.cardReview.layoutParams as ViewGroup.MarginLayoutParams
        val margin20 = (20 * density).toInt()
        cardMargins.topMargin = margin20
        cardMargins.bottomMargin = 0
        cardMargins.leftMargin = margin20
        cardMargins.rightMargin = margin20
        binding.cardReview.requestLayout()

        binding.focusBackBar.animate().alpha(0f).setDuration(duration / 2).withEndAction {
            binding.focusBackBar.visibility = View.GONE
            binding.focusBackBar.alpha = 1f
        }.start()

        binding.appBar.alpha = 0f
        binding.appBar.visibility = View.VISIBLE
        binding.appBar.translationY = -binding.appBar.height.toFloat()
        binding.appBar.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(duration)
            .start()

        val viewsToShow = listOf(
            binding.cardPoster, binding.tvTitle, binding.tvInfo,
            binding.layoutStars, binding.tvRateLabel, binding.layoutActions,
            binding.layoutReviewHeader
        )
        viewsToShow.forEach { v ->
            v.alpha = 0f
            v.translationY = 30f * density
            v.visibility = View.VISIBLE
            v.animate()
                .alpha(1f)
                .translationY(0f)
                .setDuration(duration)
                .start()
        }
    }
    
    private fun setupKeyboardInset() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
            val keyboardHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            val bottomPadding = if (isFocusMode) 0 else keyboardHeight
            binding.scrollView.setPadding(
                binding.scrollView.paddingLeft,
                binding.scrollView.paddingTop,
                binding.scrollView.paddingRight,
                bottomPadding
            )
            insets
        }
    }
    
    private fun setupObservers() {
        viewModel.movie.observe(viewLifecycleOwner) { movie ->
            binding.tvTitle.text = movie.title
            binding.tvToolbarTitle.text = movie.title
            binding.tvInfo.text = "${movie.releaseYear} • ${movie.genre}"
            
            binding.ivPoster.loadPoster(movie.posterUrl, movie.title)
        }
        
        viewModel.isLiked.observe(viewLifecycleOwner) { isLiked ->
            updateLikedButton(isLiked)
        }
        
        viewModel.isWatched.observe(viewLifecycleOwner) { isWatched ->
            updateWatchedButton(isWatched)
        }
        
        viewModel.isRewatch.observe(viewLifecycleOwner) { isRewatch ->
            if (isRewatch && !args.isEditMode) {
                binding.tvWatchedLabel.text = "REWATCHED"
                binding.btnWatched.setCardBackgroundColor(
                    ContextCompat.getColor(requireContext(), R.color.teal_watched)
                )
            }
        }
        
        viewModel.rating.observe(viewLifecycleOwner) { rating ->
            binding.starRating.rating = rating
        }
        
        viewModel.saveSuccess.observe(viewLifecycleOwner) { success ->
            if (success == true) {
                showSnackbar("Rating saved!", SnackbarType.SUCCESS)
            }
        }
        
        viewModel.saveResult.observe(viewLifecycleOwner) { result ->
            if (result == null) return@observe
            
            if (!result.success) {
                showSnackbar("Gagal menyimpan, coba lagi", SnackbarType.ERROR)
                return@observe
            }
            
            val message = if (args.isEditMode) {
                "Review updated successfully!"
            } else {
                if (result.reviewId != null) "Review saved successfully!" else "Log saved successfully!"
            }
            showSnackbar(message, SnackbarType.SUCCESS)
            
            if (args.isEditMode) {
                findNavController().navigateUp()
            } else {
                val isLog = result.reviewId == null
                val entryId = result.reviewId ?: result.diaryId
                val entryBundle = Bundle().apply {
                    putInt("reviewId", entryId)
                    putBoolean("isLog", isLog)
                    putBoolean("openComments", false)
                    putInt("diaryId", result.diaryId)
                }
                findNavController().navigate(
                    R.id.reviewDetailFragment,
                    entryBundle,
                    androidx.navigation.NavOptions.Builder()
                        .setPopUpTo(R.id.logFilmFragment, true)
                        .build()
                )
            }
        }
    }
    
    private fun setupClickListeners() {
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
    }
    
    private fun setupStarRating() {
        binding.starRating.apply {
            starSizeDp = 44f
            starGapDp = 4f
            setColors(
                ContextCompat.getColor(requireContext(), R.color.star_yellow),
                ContextCompat.getColor(requireContext(), R.color.text_secondary)
            )
            setEditable(true) { newRating ->
                currentRating = newRating
                viewModel.setRating(newRating)
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
                
                val displayFormat = SimpleDateFormat("MMM d", Locale.US)
                val displayDate = displayFormat.format(selectedCalendar.time)
                binding.tvWatchedDate.text = displayDate.uppercase()
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        
        datePickerDialog.datePicker.maxDate = System.currentTimeMillis()
        datePickerDialog.show()
    }
    
    private fun applyStyleSpan(style: Int) {
        val editText = binding.etReview
        val start = editText.selectionStart
        val end = editText.selectionEnd
        
        if (start == end) {
            showSnackbar("Please select text first", SnackbarType.ERROR)
            return
        }
        
        val spannable = editText.text as? SpannableStringBuilder ?: SpannableStringBuilder(editText.text)
        
        val existingSpans = spannable.getSpans(start, end, StyleSpan::class.java)
        val hasStyle = existingSpans.any { it.style == style }
        
        if (hasStyle) {
            existingSpans.filter { it.style == style }.forEach { spannable.removeSpan(it) }
        } else {
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
            showSnackbar("Please select text first", SnackbarType.ERROR)
            return
        }
        
        val spannable = editText.text as? SpannableStringBuilder ?: SpannableStringBuilder(editText.text)
        
        val existingSpans = spannable.getSpans(start, end, UnderlineSpan::class.java)
        
        if (existingSpans.isNotEmpty()) {
            existingSpans.forEach { spannable.removeSpan(it) }
        } else {
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
                    showSnackbar("Please enter URL", SnackbarType.ERROR)
                    return@setPositiveButton
                }
                
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
        
        return html
            .replace("<p dir=\"ltr\">", "")
            .replace("</p>", "")
            .replace("\n", "")
            .trim()
    }
    
    private fun saveLog() {
        val reviewHtml = spannableToHtml(binding.etReview.text ?: "")
        val containsSpoilers = binding.cbSpoilers.isChecked
        
        if (args.isEditMode) {
            if (args.reviewId > 0) {
                viewModel.updateReview(args.reviewId, reviewHtml, containsSpoilers, currentRating, selectedDate)
            } else {
                viewModel.saveLog(reviewHtml, containsSpoilers, selectedDate, isRewatch = false)
            }
        } else {
            val isRewatch = viewModel.isRewatch.value == true
            viewModel.saveLog(reviewHtml, containsSpoilers, selectedDate, isRewatch = isRewatch)
        }
    }

    override fun onDestroyView() {
        android.util.Log.d("LogFilm", "!!! onDestroyView() called — cleaning up listeners")
        scrollListener?.let { listener ->
            try {
                _binding?.scrollView?.viewTreeObserver?.removeOnScrollChangedListener(listener)
            } catch (_: Exception) {}
        }
        scrollListener = null
        _binding?.root?.let { root ->
            try {
                ViewCompat.setOnApplyWindowInsetsListener(root, null)
            } catch (_: Exception) {}
        }
        _binding = null
        super.onDestroyView()
    }
}
