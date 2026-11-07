package com.komputerkit.moview.ui.lists

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.databinding.FragmentFilmPickerBinding
import com.komputerkit.moview.databinding.ItemPickFilmBinding
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.util.loadThumbnail
import com.komputerkit.moview.util.showSnackbar
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView

/** Screen 4: search an existing film and add it to the list. */
class FilmPickerFragment : Fragment() {

    private var _binding: FragmentFilmPickerBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels()
    private val args: FilmPickerFragmentArgs by navArgs()
    private lateinit var adapter: PickerAdapter
    private val selected = linkedSetOf<Int>()
    private var searchJob: Job? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFilmPickerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = PickerAdapter(
            isSelected = { movie: Movie -> selected.contains(movie.id) },
            onToggle = { movie ->
                if (selected.contains(movie.id)) selected.remove(movie.id) else selected.add(movie.id)
                updateDoneLabel()
                adapter.notifyDataSetChanged()
            }
        )

        val resultsView = binding.rvResults
        resultsView.layoutManager = LinearLayoutManager(requireContext())
        resultsView.adapter = adapter

        binding.btnBack.setOnClickListener { findNavController().navigateUp() }
        binding.btnDone.setOnClickListener { submit() }

        binding.etSearch.addTextChangedListener(object : android.text.TextWatcher {
            override fun afterTextChanged(s: android.text.Editable?) = scheduleSearch(s?.toString().orEmpty())
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = Unit
        })

        viewModel.error.observe(viewLifecycleOwner) { message ->
            message?.let {
                showSnackbar(it, SnackbarType.ERROR)
                viewModel.clearError()
            }
        }

        updateDoneLabel()
    }

    private fun scheduleSearch(query: String) {
        searchJob?.cancel()
        if (query.trim().length < 2) {
            adapter.submitList(emptyList())
            binding.tvEmpty.text = "Ketik judul film untuk mencari."
            binding.tvEmpty.visibility = View.VISIBLE
            return
        }

        searchJob = viewLifecycleOwner.lifecycleScope.launch {
            delay(350)
            binding.progress.visibility = View.VISIBLE
            val results = viewModel.searchMovies(query.trim())
            binding.progress.visibility = View.GONE
            adapter.submitList(results)
            binding.tvEmpty.text = "Film tidak ditemukan."
            binding.tvEmpty.visibility = if (results.isEmpty()) View.VISIBLE else View.GONE
        }
    }

    private fun submit() {
        if (selected.isEmpty()) {
            findNavController().navigateUp()
            return
        }

        viewModel.addFilms(args.listId, selected.toList())
        findNavController().navigateUp()
    }

    private fun updateDoneLabel() {
        binding.btnDone.text = "Tambah (${selected.size})"
        binding.btnDone.alpha = if (selected.isEmpty()) 0.6f else 1f
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private class PickerAdapter(
        private val isSelected: (Movie) -> Boolean,
        private val onToggle: (Movie) -> Unit
    ) : ListAdapter<Movie, PickerAdapter.Holder>(Diff) {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
            val binding = ItemPickFilmBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return Holder(binding)
        }

        override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(getItem(position))

        inner class Holder(private val binding: ItemPickFilmBinding) : RecyclerView.ViewHolder(binding.root) {
            @SuppressLint("SetTextI18n")
            fun bind(movie: Movie) {
                binding.tvTitle.text = movie.title.orEmpty()
                binding.tvYear.text = movie.releaseYear?.toString().orEmpty()
                binding.tvYear.visibility = if (movie.releaseYear == null) View.GONE else View.VISIBLE
                binding.ivPoster.loadThumbnail(movie.posterUrl, movie.title)
                binding.cbSelected.isChecked = isSelected(movie)
                binding.root.setOnClickListener { onToggle(movie) }
            }
        }

        private object Diff : DiffUtil.ItemCallback<Movie>() {
            override fun areItemsTheSame(oldItem: Movie, newItem: Movie) = oldItem.id == newItem.id
            override fun areContentsTheSame(oldItem: Movie, newItem: Movie) = oldItem == newItem
        }
    }
}
