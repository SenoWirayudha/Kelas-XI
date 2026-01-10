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
                
                val stars = "★".repeat(review.rating.toInt())
                tvYear.text = "${review.movie.releaseYear} • $stars"
                
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

        binding.layoutActions.setOnClickListener {
            viewModel.toggleLike()
        }

        binding.ivCommentIcon.setOnClickListener {
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
                showAddCommentDialog()
            }
        }
    }

    private fun showAddCommentDialog() {
        val input = EditText(requireContext()).apply {
            hint = "Write your comment..."
            setPadding(40, 40, 40, 40)
            setTextColor(requireContext().getColor(R.color.text_primary))
            setHintTextColor(requireContext().getColor(R.color.text_secondary))
        }
        
        AlertDialog.Builder(requireContext())
            .setTitle("Add Comment")
            .setView(input)
            .setPositiveButton("Post") { _, _ ->
                val commentText = input.text.toString().trim()
                if (commentText.isNotEmpty()) {
                    viewModel.addComment(commentText)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
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
