package com.komputerkit.moview.ui.detail

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.databinding.FragmentStreamingAvailabilityBinding
import com.komputerkit.moview.ui.common.FilterSheetDialog
import com.komputerkit.moview.ui.common.FilterSheetOptions
import com.komputerkit.moview.ui.common.FilterSheetResult
import com.komputerkit.moview.util.StreamingAvailabilityUtils

class StreamingAvailabilityFragment : Fragment() {

    private var _binding: FragmentStreamingAvailabilityBinding? = null
    private val binding get() = _binding!!

    private val viewModel: StreamingAvailabilityViewModel by viewModels()
    private val args: StreamingAvailabilityFragmentArgs by navArgs()

    private lateinit var adapter: StreamingAvailabilityAdapter
    private var selectedCountry: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStreamingAvailabilityBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = StreamingAvailabilityAdapter()
        binding.rvServices.apply {
            this.adapter = adapter
            layoutManager = LinearLayoutManager(requireContext())
        }

        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }
        binding.btnFilterCountry.setOnClickListener {
            showCountryFilter()
        }

        viewModel.movie.observe(viewLifecycleOwner) { render() }
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
            if (loading) binding.tvEmpty.visibility = View.GONE
        }
        viewModel.error.observe(viewLifecycleOwner) { message ->
            if (!message.isNullOrBlank()) {
                binding.tvEmpty.text = message
                binding.tvEmpty.visibility = View.VISIBLE
            }
        }

        viewModel.load(args.movieId)
    }

    private fun showCountryFilter() {
        val options = FilterSheetOptions(
            countries = viewModel.countryOptions.value ?: emptyList()
        )
        FilterSheetDialog(
            requireContext(),
            options,
            FilterSheetResult(country = selectedCountry),
            onApply = { result ->
                selectedCountry = result.country
                binding.tvFilterCountry.text = selectedCountry ?: "All Countries"
                render()
            },
            initialCategory = FilterSheetDialog.Category.COUNTRY,
            enabledCategories = setOf(FilterSheetDialog.Category.COUNTRY)
        ).show()
    }

    private fun render() {
        val movie = viewModel.movie.value ?: return
        val filtered = StreamingAvailabilityUtils.filterByCountry(
            movie.streamingServices,
            selectedCountry
        )
        adapter.submitList(filtered)
        binding.tvEmpty.text = "No streaming services available"
        binding.tvEmpty.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
