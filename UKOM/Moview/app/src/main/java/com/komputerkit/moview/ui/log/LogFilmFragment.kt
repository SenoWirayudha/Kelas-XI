package com.komputerkit.moview.ui.log

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.bumptech.glide.Glide
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.FragmentLogFilmBinding

class LogFilmFragment : Fragment() {

    private var _binding: FragmentLogFilmBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: LogFilmViewModel by viewModels()
    private val args: LogFilmFragmentArgs by navArgs()
    
    private var currentRating = 0

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
        
        viewModel.loadMovie(args.movieId)
        
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
        
        viewModel.isRewatch.observe(viewLifecycleOwner) { isRewatch ->
            updateWatchedButton(isRewatch)
        }
    }
    
    private fun setupClickListeners() {
        binding.btnClose.setOnClickListener {
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
    
    private fun updateWatchedButton(isRewatch: Boolean) {
        if (isRewatch) {
            binding.tvWatchedLabel.text = "REWATCH"
        } else {
            binding.tvWatchedLabel.text = "WATCHED"
        }
    }
    
    private fun saveLog() {
        val reviewText = binding.etReview.text.toString()
        val containsSpoilers = binding.cbSpoilers.isChecked
        
        val success = viewModel.saveLog(reviewText, containsSpoilers)
        
        if (success) {
            Toast.makeText(requireContext(), "Film logged successfully!", Toast.LENGTH_SHORT).show()
            findNavController().navigateUp()
        } else {
            Toast.makeText(requireContext(), "Failed to log film", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
