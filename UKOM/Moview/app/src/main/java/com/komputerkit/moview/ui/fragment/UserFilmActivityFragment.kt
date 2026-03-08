package com.komputerkit.moview.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.google.android.material.tabs.TabLayoutMediator
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.FragmentUserFilmActivityBinding
import com.komputerkit.moview.ui.viewmodel.UserFilmActivityViewModel
import com.komputerkit.moview.util.MovieActionsHelper
import com.komputerkit.moview.util.loadPoster

class UserFilmActivityFragment : Fragment() {
    private var _binding: FragmentUserFilmActivityBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: UserFilmActivityViewModel by activityViewModels()
    private val args: UserFilmActivityFragmentArgs by navArgs()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentUserFilmActivityBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupToolbar()
        setupViewPager()
        setupObservers()
        
        // Load data
        viewModel.loadUserFilmActivity(args.userId, args.filmId)
    }
    
    private fun setupToolbar() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }
    
    private fun setupViewPager() {
        val pagerAdapter = UserFilmActivityPagerAdapter(this)
        binding.viewPager.adapter = pagerAdapter
        
        // Connect TabLayout with ViewPager2
        TabLayoutMediator(binding.tabLayout, binding.viewPager) { tab, position ->
            tab.text = when (position) {
                0 -> "DIARY"
                1 -> "REVIEWS"
                else -> ""
            }
        }.attach()
    }
    
    private fun setupObservers() {
        viewModel.activityTitle.observe(viewLifecycleOwner) { title ->
            binding.tvTitle.text = title
        }

        viewModel.movie.observe(viewLifecycleOwner) { movieInfo ->
            val posterUrl = movieInfo.poster_path
            if (!posterUrl.isNullOrEmpty()) {
                binding.ivMoviePoster.visibility = View.VISIBLE
                binding.ivMoviePoster.loadPoster(posterUrl)
            }

            val movieModel = Movie(
                id = movieInfo.id,
                title = movieInfo.title,
                posterUrl = posterUrl,
                averageRating = null,
                genre = null,
                releaseYear = movieInfo.year,
                description = null
            )

            binding.ivMoviePoster.setOnLongClickListener { view ->
                MovieActionsHelper.showMovieActionsBottomSheet(
                    context = view.context,
                    movie = movieModel,
                    isFromMovieDetail = false,
                    onGoToFilm = {
                        val action = UserFilmActivityFragmentDirections
                            .actionUserFilmActivityToMovieDetail(movieInfo.id)
                        findNavController().navigate(action)
                    },
                    onLogFilm = {
                        val action = UserFilmActivityFragmentDirections
                            .actionUserFilmActivityToLogFilm(movieInfo.id)
                        findNavController().navigate(action)
                    },
                    onChangePoster = {
                        val action = UserFilmActivityFragmentDirections
                            .actionUserFilmActivityToPosterBackdrop(movieInfo.id, false)
                        findNavController().navigate(action)
                    }
                )
                true
            }
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
    
    /**
     * ViewPager2 Adapter for tabs
     */
    private inner class UserFilmActivityPagerAdapter(fragment: Fragment) : FragmentStateAdapter(fragment) {
        override fun getItemCount(): Int = 2

        override fun createFragment(position: Int): Fragment {
            return when (position) {
                0 -> UserFilmActivityTabFragment.newInstance(UserFilmActivityTabFragment.TAB_DIARY, args.userId, args.filmId)
                1 -> UserFilmActivityTabFragment.newInstance(UserFilmActivityTabFragment.TAB_REVIEWS, args.userId, args.filmId)
                else -> throw IllegalStateException("Invalid tab position: $position")
            }
        }
    }
}
