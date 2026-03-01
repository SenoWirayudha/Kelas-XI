package com.komputerkit.moview.ui.fragment

import android.app.Dialog
import android.os.Bundle
import android.text.Html
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.StyleSpan
import android.text.style.UnderlineSpan
import android.text.style.URLSpan
import android.text.method.LinkMovementMethod
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.PopupMenu
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.R
import com.komputerkit.moview.data.model.Comment
import com.komputerkit.moview.databinding.BottomSheetCommentsBinding
import com.komputerkit.moview.databinding.FragmentReviewDetailBinding
import com.komputerkit.moview.ui.adapter.CommentAdapter
import com.komputerkit.moview.ui.adapter.LikedReviewAdapter
import com.komputerkit.moview.ui.viewmodel.ReviewDetailViewModel
import com.komputerkit.moview.util.loadBackdrop
import com.komputerkit.moview.util.loadPoster
import com.komputerkit.moview.util.loadProfilePhoto

class ReviewDetailFragment : Fragment() {
    private var _binding: FragmentReviewDetailBinding?= null
    private val binding get() = _binding!!
    
    private val viewModel: ReviewDetailViewModel by viewModels()
    private val args: ReviewDetailFragmentArgs by navArgs()
    
    private var commentsBottomSheet: BottomSheetDialog? = null
    private var commentsBinding: BottomSheetCommentsBinding? = null
    private lateinit var commentAdapter: CommentAdapter
    private lateinit var likedReviewsAdapter: LikedReviewAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReviewDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupLikedReviewsRecyclerView()
        setupObservers()
        setupClickListeners()
        
        viewModel.loadReview(args.reviewId, args.isLog)
    }
    
    private fun setupLikedReviewsRecyclerView() {
        likedReviewsAdapter = LikedReviewAdapter(
            onReviewClick = { reviewId ->
                val action = ReviewDetailFragmentDirections.actionReviewDetailSelf(reviewId, false)
                findNavController().navigate(action)
            }
        )
        
        binding.rvLikedMovies.apply {
            adapter = likedReviewsAdapter
            layoutManager = androidx.recyclerview.widget.LinearLayoutManager(
                requireContext(),
                androidx.recyclerview.widget.LinearLayoutManager.HORIZONTAL,
                false
            )
        }
    }

    override fun onResume() {
        super.onResume()
        // Reload review data when returning from edit screen
        // This ensures log entries that were edited to add review text
        // will now show as review detail instead of log detail
        viewModel.loadReview(args.reviewId, args.isLog)
    }

    private fun setupObservers() {
        viewModel.review.observe(viewLifecycleOwner) { review ->
            binding.apply {
                // Load backdrop using extension for fast loading
                ivBackdrop.loadBackdrop(review.movie.backdropUrl)

                // Load profile photo using extension with circular crop
                ivProfile.loadProfilePhoto(review.userAvatar)

                // Load poster using extension for fast loading
                ivPoster.loadPoster(review.movie.posterUrl)

                tvUsername.text = review.userName
                
                // Always show 3-dot menu (different menu for own vs other's review)
                btnMoreOptions.visibility = View.VISIBLE
                
                // Check if own review for like button
                val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
                val currentUserId = prefs.getInt("userId", 0)
                val isOwnReview = review.userId == currentUserId
                
                // Disable like button for own review
                ivLikeIcon.isEnabled = !isOwnReview
                tvLikeCount.isEnabled = !isOwnReview
                ivLikeIcon.alpha = if (isOwnReview) 0.3f else 1.0f
                
                tvMovieTitle.text = review.movie.title
                
                // Display year and stars separately
                tvYear.text = review.movie.releaseYear.toString()
                
                // Display star rating
                val stars = "★".repeat(review.rating.toInt().coerceIn(0, 5))
                tvRatingStars.text = stars
                
                // Show liked icon if movie was liked when review was written
                ivLikedIcon.visibility = if (review.isLiked) View.VISIBLE else View.GONE
                
                tvPostedTime.text = review.timeAgo
                
                // Display review text with HTML formatting and clickable links
                if (review.reviewText.isNotEmpty()) {
                    val htmlText = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                        Html.fromHtml(review.reviewText, Html.FROM_HTML_MODE_COMPACT)
                    } else {
                        @Suppress("DEPRECATION")
                        Html.fromHtml(review.reviewText)
                    }
                    tvReviewText.text = htmlText
                    tvReviewText.movementMethod = LinkMovementMethod.getInstance()
                } else {
                    tvReviewText.text = review.reviewText
                }
                
                // Show tag if available
                if (review.hasTag && review.tag.isNotEmpty()) {
                    tvTag.visibility = View.VISIBLE
                    tvTag.text = review.tag
                } else {
                    tvTag.visibility = View.GONE
                }
            }
        }

        viewModel.likeCount.observe(viewLifecycleOwner) { count ->
            binding.tvLikeCount.text = formatCount(count)
        }

        viewModel.isLiked.observe(viewLifecycleOwner) { isLiked ->
            if (isLiked) {
                binding.ivLikeIcon.setImageResource(R.drawable.ic_heart_filled)
                binding.ivLikeIcon.setColorFilter(requireContext().getColor(R.color.pink_like))
            } else {
                binding.ivLikeIcon.setImageResource(R.drawable.ic_heart_outline)
                binding.ivLikeIcon.setColorFilter(requireContext().getColor(R.color.text_secondary))
            }
        }

        viewModel.commentCount.observe(viewLifecycleOwner) { count ->
            binding.tvCommentCount.text = count.toString()
            
            // Auto-open comments if navigated from notification
            if (args.openComments && count > 0 && commentsBottomSheet == null) {
                // Post with slight delay to ensure UI is ready
                view?.postDelayed({
                    showCommentsBottomSheet()
                }, 300)
            }
        }
        
        viewModel.isLog.observe(viewLifecycleOwner) { isLog ->
            binding.apply {
                if (isLog) {
                    // Hide review-specific elements for log entries
                    tvReviewText.visibility = View.GONE
                    layoutActions.visibility = View.GONE  // Like, Comment, Share buttons
                    tvMoreFrom.visibility = View.GONE
                    rvLikedMovies.visibility = View.GONE
                    
                    // Change label from "REVIEWED BY" to "LOGGED BY"
                    tvReviewerName.text = "LOGGED BY"
                } else {
                    // Show all elements for reviews
                    tvReviewText.visibility = View.VISIBLE
                    layoutActions.visibility = View.VISIBLE  // Show like, comment, share buttons
                    // tvMoreFrom and rvLikedMovies visibility will be set by liked movies observers
                    
                    tvReviewerName.text = "REVIEWED BY"
                }
            }
        }
        
        // Observe liked reviews data
        viewModel.likedReviews.observe(viewLifecycleOwner) { reviews ->
            binding.apply {
                if (reviews.isEmpty()) {
                    tvMoreFrom.visibility = View.GONE
                    rvLikedMovies.visibility = View.GONE
                } else {
                    tvMoreFrom.visibility = View.VISIBLE
                    rvLikedMovies.visibility = View.VISIBLE
                    likedReviewsAdapter.submitList(reviews)
                }
            }
        }
        
        // Observe liked by text ("YOU LIKED" or "Liked by...")
        viewModel.likedByText.observe(viewLifecycleOwner) { text ->
            binding.tvMoreFrom.text = text
        }
        
        viewModel.deleteStatus.observe(viewLifecycleOwner) { success ->
            if (success) {
                val isReview = viewModel.review.value?.reviewId ?: 0 > 0
                val message = if (isReview) "Review deleted successfully" else "Log entry deleted successfully"
                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
                findNavController().navigateUp()
            } else {
                Toast.makeText(requireContext(), "Failed to delete", Toast.LENGTH_SHORT).show()
            }
        }
        
        viewModel.flagStatus.observe(viewLifecycleOwner) { success ->
            if (success) {
                Toast.makeText(requireContext(), "Review reported successfully", Toast.LENGTH_SHORT).show()
                // Hide menu after reporting
                binding.btnMoreOptions.visibility = View.GONE
            } else {
                Toast.makeText(requireContext(), "Failed to report review", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        
        binding.btnMoreOptions.setOnClickListener {
            showOptionsMenu(it)
        }

        binding.cardProfile.setOnClickListener {
            viewModel.review.value?.let { review ->
                val action = ReviewDetailFragmentDirections.actionReviewDetailToProfile(review.userId)
                findNavController().navigate(action)
            }
        }

        binding.cardPoster.setOnClickListener {
            viewModel.review.value?.let { review ->
                val action = ReviewDetailFragmentDirections.actionReviewDetailToMovieDetail(review.movie.id)
                findNavController().navigate(action)
            }
        }

        // Like button - check if own review before allowing toggle
        binding.ivLikeIcon.setOnClickListener {
            viewModel.review.value?.let { review ->
                val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
                val currentUserId = prefs.getInt("userId", 0)
                
                if (review.userId != currentUserId) {
                    viewModel.toggleLike()
                } else {
                    Toast.makeText(requireContext(), "You can't like your own review", Toast.LENGTH_SHORT).show()
                }
            }
        }
        
        binding.tvLikeCount.setOnClickListener {
            viewModel.review.value?.let { review ->
                val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
                val currentUserId = prefs.getInt("userId", 0)
                
                if (review.userId != currentUserId) {
                    viewModel.toggleLike()
                } else {
                    Toast.makeText(requireContext(), "You can't like your own review", Toast.LENGTH_SHORT).show()
                }
            }
        }

        // Comment button - use both icon and count as clickable
        binding.ivCommentIcon.setOnClickListener {
            showCommentsBottomSheet()
        }
        
        binding.tvCommentCount.setOnClickListener {
            showCommentsBottomSheet()
        }

        binding.ivShareIcon.setOnClickListener {
            // TODO: Implement share functionality
        }
    }

    private fun showCommentsBottomSheet() {
        // Always refresh data when showing bottom sheet
        viewModel.refreshComments()
        
        if (commentsBottomSheet == null) {
            commentsBottomSheet = BottomSheetDialog(requireContext(), R.style.BottomSheetDialogTheme)
            commentsBinding = BottomSheetCommentsBinding.inflate(layoutInflater)
            commentsBottomSheet?.setContentView(commentsBinding!!.root)
            
            setupCommentsBottomSheet()
            
            // Setup bottom sheet behavior
            commentsBottomSheet?.setOnShowListener { dialog ->
                val bottomSheet = (dialog as BottomSheetDialog).findViewById<FrameLayout>(
                    com.google.android.material.R.id.design_bottom_sheet
                )
                bottomSheet?.let {
                    val behavior = BottomSheetBehavior.from(it)
                    
                    // Set max height to 75% of screen, prevent full screen expansion
                    val displayMetrics = resources.displayMetrics
                    val screenHeight = displayMetrics.heightPixels
                    val maxHeight = (screenHeight * 0.75).toInt()
                    
                    // Set fixed height
                    val layoutParams = it.layoutParams
                    layoutParams.height = maxHeight
                    it.layoutParams = layoutParams
                    
                    behavior.peekHeight = maxHeight
                    behavior.state = BottomSheetBehavior.STATE_EXPANDED
                    behavior.isHideable = true
                    behavior.skipCollapsed = true
                    behavior.isDraggable = true
                }
            }
        }
        
        commentsBottomSheet?.show()
    }

    private fun setupCommentsBottomSheet() {
        commentsBinding?.apply {
            // Setup RecyclerView
            commentAdapter = CommentAdapter(
                currentUserId = getCurrentUserId(),
                onProfileClick = { userId ->
                    commentsBottomSheet?.dismiss()
                    val action = ReviewDetailFragmentDirections.actionReviewDetailToProfile(userId)
                    findNavController().navigate(action)
                },
                onReplyClick = { comment ->
                    viewModel.setReplyTarget(comment)
                    showAddCommentBottomSheet()
                },
                onDeleteClick = { comment ->
                    showDeleteCommentDialog(comment)
                },
                onFlagClick = { comment ->
                    showFlagCommentDialog(comment)
                }
            )
            
            rvComments.apply {
                layoutManager = LinearLayoutManager(requireContext())
                adapter = commentAdapter
            }
            
            // Observe comments
            viewModel.comments.observe(viewLifecycleOwner) { comments ->
                android.util.Log.d("ReviewDetail", "Comments updated: ${comments.size} top-level comments")
                commentAdapter.submitList(comments)
                // Count all comments including replies
                val totalCount = comments.sumOf { 1 + it.replies.size }
                android.util.Log.d("ReviewDetail", "Total count with replies: $totalCount")
                tvTitle.text = "Comments ($totalCount)"
                // Stop refresh animation if it's running
                swipeRefresh.isRefreshing = false
            }
            
            // Setup swipe to refresh
            swipeRefresh.setOnRefreshListener {
                viewModel.refreshComments()
            }
            
            // Set refresh colors
            swipeRefresh.setColorSchemeResources(
                R.color.accent_blue,
                R.color.pink_like,
                R.color.star_yellow
            )
            
            btnClose.setOnClickListener {
                commentsBottomSheet?.dismiss()
            }
            
            fabAddComment.setOnClickListener {
                viewModel.clearReplyTarget()
                showAddCommentBottomSheet()
            }
        }
    }

    private fun showAddCommentBottomSheet() {
        val addCommentSheet = BottomSheetDialog(requireContext(), R.style.BottomSheetDialogTheme)
        val dialogBinding = com.komputerkit.moview.databinding.DialogAddCommentBinding.inflate(layoutInflater)
        addCommentSheet.setContentView(dialogBinding.root)
        
        // Setup bottom sheet behavior
        addCommentSheet.setOnShowListener { dialog ->
            val bottomSheet = (dialog as BottomSheetDialog).findViewById<FrameLayout>(
                com.google.android.material.R.id.design_bottom_sheet
            )
            bottomSheet?.let {
                val behavior = BottomSheetBehavior.from(it)
                behavior.state = BottomSheetBehavior.STATE_EXPANDED
                behavior.skipCollapsed = true
            }
        }
        
        // Show reply reference if replying to a comment
        viewModel.replyingTo.value?.let { replyComment ->
            dialogBinding.layoutReference?.visibility = View.VISIBLE
            dialogBinding.tvReferenceText?.text = "Replying to @${replyComment.username}: ${replyComment.commentText}"
        } ?: run {
            dialogBinding.layoutReference?.visibility = View.GONE
        }
        
        // Handle close button on reference layout
        dialogBinding.btnCloseReference?.setOnClickListener {
            viewModel.clearReplyTarget()
            dialogBinding.layoutReference?.visibility = View.GONE
        }
        
        // Formatting toolbar buttons
        dialogBinding.btnBold?.setOnClickListener {
            applyStyleSpan(dialogBinding.etComment, android.graphics.Typeface.BOLD)
        }
        
        dialogBinding.btnItalic?.setOnClickListener {
            applyStyleSpan(dialogBinding.etComment, android.graphics.Typeface.ITALIC)
        }
        
        dialogBinding.btnUnderline?.setOnClickListener {
            applyUnderlineSpan(dialogBinding.etComment)
        }
        
        dialogBinding.btnLink?.setOnClickListener {
            showInsertLinkDialog(dialogBinding.etComment)
        }
        
        // Character count and preview
        dialogBinding.etComment.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                val text = s?.toString() ?: ""
                val length = text.length
                dialogBinding.tvCharCount.text = "$length/500"
                
                // Change color if approaching limit
                if (length > 450) {
                    dialogBinding.tvCharCount.setTextColor(requireContext().getColor(R.color.pink_like))
                } else {
                    dialogBinding.tvCharCount.setTextColor(requireContext().getColor(R.color.text_secondary))
                }
            }
        })
        
        dialogBinding.btnCancel.setOnClickListener {
            viewModel.clearReplyTarget()
            addCommentSheet.dismiss()
        }
        
        dialogBinding.btnPost.setOnClickListener {
            val commentSpannable = dialogBinding.etComment.text
            val commentText = spannableToHtml(commentSpannable)
            if (commentText.isNotEmpty()) {
                viewModel.addComment(commentText)
                addCommentSheet.dismiss()
                Toast.makeText(requireContext(), "Comment posted", Toast.LENGTH_SHORT).show()
                
                // Refresh comments list after a delay to ensure server has processed
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    viewModel.refreshComments()
                }, 500)
            }
        }
        
        addCommentSheet.setOnDismissListener {
            viewModel.clearReplyTarget()
        }
        
        addCommentSheet.show()
        
        // Show keyboard automatically
        dialogBinding.etComment.requestFocus()
        dialogBinding.etComment.postDelayed({
            val imm = requireContext().getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
            imm.showSoftInput(dialogBinding.etComment, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
        }, 200)
    }

    private fun formatCount(count: Int): String {
        return when {
            count >= 1000 -> String.format("%.1fk", count / 1000.0)
            else -> count.toString()
        }
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
    
    private fun applyStyleSpan(editText: EditText, style: Int) {
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
    
    private fun applyUnderlineSpan(editText: EditText) {
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
    
    private fun showInsertLinkDialog(editText: EditText) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_insert_link, null)
        val etLinkText = dialogView.findViewById<EditText>(R.id.et_link_text)
        val etLinkUrl = dialogView.findViewById<EditText>(R.id.et_link_url)
        
        val start = editText.selectionStart
        val end = editText.selectionEnd
        
        // Pre-fill text with selected text if any
        if (start != end) {
            etLinkText.setText(editText.text.substring(start, end))
        }
        
        AlertDialog.Builder(requireContext())
            .setTitle("Insert Link")
            .setView(dialogView)
            .setPositiveButton("Insert") { _, _ ->
                val url = etLinkUrl.text.toString().trim()
                var linkText = etLinkText.text.toString().trim()
                
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
                
                if (linkText.isEmpty()) {
                    linkText = fullUrl
                }
                
                val spannable = editText.text as? SpannableStringBuilder ?: SpannableStringBuilder(editText.text)
                val currentStart = editText.selectionStart
                val currentEnd = editText.selectionEnd
                
                if (currentStart != currentEnd) {
                    // Replace selected text with link
                    spannable.replace(currentStart, currentEnd, linkText)
                    spannable.setSpan(
                        URLSpan(fullUrl),
                        currentStart,
                        currentStart + linkText.length,
                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    )
                    editText.setText(spannable)
                    editText.setSelection(currentStart + linkText.length)
                } else {
                    // Insert link at cursor position
                    spannable.insert(currentStart, linkText)
                    spannable.setSpan(
                        URLSpan(fullUrl),
                        currentStart,
                        currentStart + linkText.length,
                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    )
                    editText.setText(spannable)
                    editText.setSelection(currentStart + linkText.length)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun showOptionsMenu(view: View) {
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
        val currentUserId = prefs.getInt("userId", 0)
        val reviewUserId = viewModel.review.value?.userId ?: 0
        val isOwnReview = currentUserId == reviewUserId
        
        if (isOwnReview) {
            // Show edit/delete menu for own review
            val popup = PopupMenu(requireContext(), view)
            popup.menuInflater.inflate(R.menu.menu_review_options, popup.menu)
            
            popup.setOnMenuItemClickListener { item ->
                when (item.itemId) {
                    R.id.action_edit -> {
                        navigateToEditReview()
                        true
                    }
                    R.id.action_delete -> {
                        showDeleteConfirmation()
                        true
                    }
                    else -> false
                }
            }
            popup.show()
        } else {
            // Show report menu for other's review
            showReportMenu(view)
        }
    }
    
    private fun showReportMenu(view: View) {
        val popup = PopupMenu(requireContext(), view)
        popup.menuInflater.inflate(R.menu.menu_review_report, popup.menu)
        
        popup.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                R.id.action_report -> {
                    showReportConfirmation()
                    true
                }
                else -> false
            }
        }
        popup.show()
    }
    
    private fun showReportConfirmation() {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Report Review")
            .setMessage("Are you sure you want to report this review? It will be flagged for admin review.")
            .setPositiveButton("Report") { _, _ ->
                viewModel.review.value?.let { review ->
                    viewModel.flagReview(review.reviewId)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun navigateToEditReview() {
        viewModel.review.value?.let { review ->
            val action = ReviewDetailFragmentDirections.actionReviewDetailToEditReview(
                movieId = review.movieId,
                isEditMode = true,
                reviewId = review.reviewId,
                existingReviewText = review.reviewText,
                existingRating = review.rating.toInt(),
                watchedDate = review.watchedAt
            )
            findNavController().navigate(action)
        }
    }
    
    private fun showDeleteConfirmation() {
        val isReview = viewModel.review.value?.reviewId ?: 0 > 0
        val title = if (isReview) "Delete Review" else "Delete Log Entry"
        val message = if (isReview) "Are you sure you want to delete this review?" else "Are you sure you want to delete this log entry?"
        
        AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("Delete") { _, _ ->
                deleteReview()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun deleteReview() {
        viewModel.review.value?.let { review ->
            // Pass both reviewId and id (diaryId)
            // If reviewId > 0, delete review (and diary)
            // If reviewId == 0, delete diary only
            viewModel.deleteEntry(review.reviewId, review.id)
        }
    }
    
    private fun getCurrentUserId(): Int {
        val prefs = requireContext().getSharedPreferences("MoviewPrefs", android.content.Context.MODE_PRIVATE)
        return prefs.getInt("userId", 0)
    }
    
    private fun showDeleteCommentDialog(comment: Comment) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Comment")
            .setMessage("Are you sure you want to delete this comment?")
            .setPositiveButton("Delete") { _, _ ->
                viewModel.deleteComment(comment.id)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun showFlagCommentDialog(comment: Comment) {
        AlertDialog.Builder(requireContext())
            .setTitle("Report Comment")
            .setMessage("Report this comment as inappropriate?")
            .setPositiveButton("Report") { _, _ ->
                viewModel.flagComment(comment.id)
                Toast.makeText(requireContext(), "Comment reported", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        commentsBinding = null
        commentsBottomSheet = null
        _binding = null
    }
}
