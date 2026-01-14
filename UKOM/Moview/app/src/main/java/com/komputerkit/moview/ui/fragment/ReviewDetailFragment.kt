package com.komputerkit.moview.ui.fragment

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.BottomSheetCommentsBinding
import com.komputerkit.moview.databinding.FragmentReviewDetailBinding
import com.komputerkit.moview.ui.adapter.CommentAdapter
import com.komputerkit.moview.ui.viewmodel.ReviewDetailViewModel

class ReviewDetailFragment : Fragment() {
    private var _binding: FragmentReviewDetailBinding?= null
    private val binding get() = _binding!!
    
    private val viewModel: ReviewDetailViewModel by viewModels()
    private val args: ReviewDetailFragmentArgs by navArgs()
    
    private var commentsBottomSheet: BottomSheetDialog? = null
    private var commentsBinding: BottomSheetCommentsBinding? = null
    private lateinit var commentAdapter: CommentAdapter

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
        
        setupObservers()
        setupClickListeners()
        
        viewModel.loadReview(args.reviewId)
    }

    private fun setupObservers() {
        viewModel.review.observe(viewLifecycleOwner) { review ->
            binding.apply {
                // Load backdrop
                Glide.with(requireContext())
                    .load(review.movie.backdropUrl)
                    .placeholder(R.color.dark_card)
                    .into(ivBackdrop)

                // Load profile
                Glide.with(requireContext())
                    .load(review.userAvatar)
                    .placeholder(R.color.dark_card)
                    .circleCrop()
                    .into(ivProfile)

                // Load poster
                Glide.with(requireContext())
                    .load(review.movie.posterUrl)
                    .placeholder(R.color.dark_card)
                    .into(ivPoster)

                tvUsername.text = review.userName
                tvMovieTitle.text = review.movie.title
                
                // Build year and stars with colored stars
                val stars = "★".repeat(review.rating.toInt())
                val yearText = "${review.movie.releaseYear} • "
                val fullText = yearText + stars
                val spannable = android.text.SpannableString(fullText)
                spannable.setSpan(
                    android.text.style.ForegroundColorSpan(requireContext().getColor(R.color.star_green)),
                    yearText.length,
                    fullText.length,
                    android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
                )
                tvYear.text = spannable
                
                tvPostedTime.text = review.timeAgo
                tvReviewText.text = review.reviewText
                
                // Show tag if available
                if (review.hasTag && review.tag.isNotEmpty()) {
                    tvTag.visibility = View.VISIBLE
                    tvTag.text = review.tag
                } else {
                    tvTag.visibility = View.GONE
                }
                
                tvMoreFrom.text = "MORE FROM ${review.userName.uppercase()}"
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
        }
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
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

        // Like button - use both icon and count as clickable
        binding.ivLikeIcon.setOnClickListener {
            viewModel.toggleLike()
        }
        
        binding.tvLikeCount.setOnClickListener {
            viewModel.toggleLike()
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
        if (commentsBottomSheet == null) {
            commentsBottomSheet = BottomSheetDialog(requireContext(), R.style.BottomSheetDialogTheme)
            commentsBinding = BottomSheetCommentsBinding.inflate(layoutInflater)
            commentsBottomSheet?.setContentView(commentsBinding!!.root)
            
            // Setup bottom sheet behavior
            commentsBottomSheet?.setOnShowListener { dialog ->
                val bottomSheet = (dialog as BottomSheetDialog).findViewById<FrameLayout>(
                    com.google.android.material.R.id.design_bottom_sheet
                )
                bottomSheet?.let {
                    val behavior = BottomSheetBehavior.from(it)
                    behavior.state = BottomSheetBehavior.STATE_EXPANDED
                    behavior.skipCollapsed = true
                }
            }
            
            setupCommentsBottomSheet()
        }
        
        commentsBottomSheet?.show()
    }

    private fun setupCommentsBottomSheet() {
        commentsBinding?.apply {
            // Setup RecyclerView
            commentAdapter = CommentAdapter(
                onProfileClick = { userId ->
                    commentsBottomSheet?.dismiss()
                    val action = ReviewDetailFragmentDirections.actionReviewDetailToProfile(userId)
                    findNavController().navigate(action)
                },
                onLikeClick = { comment ->
                    viewModel.toggleCommentLike(comment)
                }
            )
            
            rvComments.apply {
                layoutManager = LinearLayoutManager(requireContext())
                adapter = commentAdapter
            }
            
            // Observe comments
            viewModel.comments.observe(viewLifecycleOwner) { comments ->
                commentAdapter.submitList(comments)
                tvTitle.text = "Comments (${comments.size})"
            }
            
            btnClose.setOnClickListener {
                commentsBottomSheet?.dismiss()
            }
            
            fabAddComment.setOnClickListener {
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
        
        // Character count
        dialogBinding.etComment.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                val length = s?.length ?: 0
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
            addCommentSheet.dismiss()
        }
        
        dialogBinding.btnPost.setOnClickListener {
            val commentText = dialogBinding.etComment.text.toString().trim()
            if (commentText.isNotEmpty()) {
                viewModel.addComment(commentText)
                addCommentSheet.dismiss()
            }
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

    override fun onDestroyView() {
        super.onDestroyView()
        commentsBinding = null
        commentsBottomSheet = null
        _binding = null
    }
}
