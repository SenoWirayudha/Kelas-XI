package com.komputerkit.moview.ui.share

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.komputerkit.moview.databinding.FragmentPosterGeneratorBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.showSnackbar

/**
 * Share Poster Generator: pick 3 backdrops -> preview collage -> post to Instagram Stories.
 *
 * Backdrop picking is delegated to the existing "change poster/backdrop" screen running in
 * share mode (backdrop tab only, multi-select), so there is a single picker implementation.
 * The poster, rating and author identity are the values already resolved by the Log/Review
 * detail screen (nav args), so custom-poster and half-star logic is reused, not duplicated.
 */
class PosterGeneratorFragment : Fragment() {

    private var _binding: FragmentPosterGeneratorBinding? = null
    private val binding get() = _binding!!

    private val viewModel: PosterGeneratorViewModel by viewModels()
    private val args: PosterGeneratorFragmentArgs by navArgs()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPosterGeneratorBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupClickListeners()
        setupObservers()
        setupPickerResultListener()

        viewModel.load(
            title = args.title.orEmpty(),
            rating = args.rating,
            username = args.username.orEmpty(),
            posterUrl = args.posterUrl,
            profilePhotoUrl = args.profilePhotoUrl
        )

        // Pull any result already left by the picker *before* deciding to open it, otherwise
        // returning from the picker would immediately open it again (double flow).
        consumePendingPickerResult()

        // Still nothing chosen: send the user straight to the picker.
        if (viewModel.selectedUrls.value.orEmpty().isEmpty()) {
            openPicker()
        }
    }

    /** Reads the picker's savedStateHandle value synchronously (LiveData delivery is async). */
    private fun consumePendingPickerResult() {
        val handle = findNavController().currentBackStackEntry?.savedStateHandle ?: return
        val urls = handle.get<ArrayList<String>>(KEY_SELECTED_URLS)
        if (!urls.isNullOrEmpty()) {
            viewModel.setSelectedUrls(urls)
            handle.remove<ArrayList<String>>(KEY_SELECTED_URLS)
        }
    }

    private fun setupPickerResultListener() {
        findNavController().currentBackStackEntry?.savedStateHandle
            ?.getLiveData<ArrayList<String>>(KEY_SELECTED_URLS)
            ?.observe(viewLifecycleOwner) { urls ->
                if (urls.isNullOrEmpty()) return@observe
                viewModel.setSelectedUrls(urls)
                findNavController().currentBackStackEntry
                    ?.savedStateHandle?.remove<ArrayList<String>>(KEY_SELECTED_URLS)
            }
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener { findNavController().navigateUp() }

        // Both the empty-state button and the "Ganti" button open the shared picker.
        binding.btnChange.setOnClickListener { openPicker() }
        binding.btnChangePreview.setOnClickListener { openPicker() }

        binding.btnShare.setOnClickListener {
            viewModel.share(requireContext())
        }
    }

    private fun openPicker() {
        val action = PosterGeneratorFragmentDirections
            .actionPosterGeneratorToPosterBackdrop(
                movieId = args.movieId,
                shareMode = true,
                initialUrls = viewModel.selectedUrls.value?.toTypedArray()
            )
        findNavController().navigate(action)
    }

    private fun setupObservers() {
        viewModel.selectedUrls.observe(viewLifecycleOwner) { selected ->
            if (selected.size == PosterGeneratorViewModel.MAX_SCENES) {
                viewModel.loadPreview(requireContext())
                showPreview()
            } else {
                showSelection()
            }
        }

        viewModel.previewContent.observe(viewLifecycleOwner) { content ->
            binding.posterPreview.setContent(content)
        }

        viewModel.shareEvent.observe(viewLifecycleOwner) { event ->
            when (event) {
                is PosterGeneratorViewModel.ShareResult.InstagramOpened -> {
                    viewModel.consumeShareEvent()
                    showSnackbar("Membuka Instagram Stories…", SnackbarType.SUCCESS)
                }
                is PosterGeneratorViewModel.ShareResult.SavedToGallery -> {
                    viewModel.consumeShareEvent()
                    showSnackbar(
                        "Poster disimpan ke galeri. Instagram tidak dapat dibuka.",
                        SnackbarType.INFO
                    )
                }
                is PosterGeneratorViewModel.ShareResult.Failed -> {
                    viewModel.consumeShareEvent()
                    showSnackbar(event.reason, SnackbarType.ERROR)
                }
                null -> Unit
            }
        }
    }

    private fun showSelection() {
        binding.layoutSelection.isVisible = true
        binding.layoutPreview.isVisible = false
    }

    private fun showPreview() {
        binding.layoutSelection.isVisible = false
        binding.layoutPreview.isVisible = true
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val KEY_SELECTED_URLS = "selected_backdrop_urls"
    }
}