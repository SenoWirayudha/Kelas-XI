package com.komputerkit.moview.ui.lists

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.komputerkit.moview.data.model.ArtworkOption
import com.komputerkit.moview.databinding.DialogListArtworkBinding
import com.komputerkit.moview.databinding.ItemArtworkOptionBinding
import com.komputerkit.moview.util.loadThumbnail

/**
 * Picks a list-scoped poster/backdrop for one film. Null keeps the current
 * choice; "reset" clears both so the film default returns.
 */
class ArtworkSheetFragment : BottomSheetDialogFragment() {

    private var _binding: DialogListArtworkBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FilmListViewModel by viewModels({ requireParentFragment() })

    private var listId: Int = 0
    private var movieId: Int = 0
    private var posterMediaId: Int? = null
    private var backdropMediaId: Int? = null

    private lateinit var posterAdapter: OptionAdapter
    private lateinit var backdropAdapter: OptionAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogListArtworkBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        listId = arguments?.getInt(ARG_LIST_ID) ?: 0
        movieId = arguments?.getInt(ARG_MOVIE_ID) ?: 0
        posterMediaId = arguments?.getInt(ARG_POSTER_ID)?.takeIf { it > 0 }
        backdropMediaId = arguments?.getInt(ARG_BACKDROP_ID)?.takeIf { it > 0 }

        posterAdapter = OptionAdapter { option ->
            posterMediaId = option.id
            apply()
        }
        backdropAdapter = OptionAdapter { option ->
            backdropMediaId = option.id
            apply()
        }

        binding.rvPosters.layoutManager =
            LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        binding.rvPosters.adapter = posterAdapter

        binding.rvBackdrops.layoutManager =
            LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        binding.rvBackdrops.adapter = backdropAdapter

        binding.btnReset.setOnClickListener {
            posterMediaId = null
            backdropMediaId = null
            apply()
        }

        viewModel.artwork.observe(viewLifecycleOwner) { artwork ->
            if (artwork == null) return@observe
            posterAdapter.submit(artwork.posters, posterMediaId)
            backdropAdapter.submit(artwork.backdrops, backdropMediaId)
        }

        viewModel.loadMovieArtwork(movieId)
    }

    private fun apply() {
        viewModel.setItemMedia(listId, movieId, posterMediaId, backdropMediaId)
        dismiss()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private class OptionAdapter(
        private val onPick: (ArtworkOption) -> Unit
    ) : RecyclerView.Adapter<OptionAdapter.Holder>() {

        private val items = mutableListOf<ArtworkOption>()
        private var selectedId: Int? = null

        fun submit(newItems: List<ArtworkOption>, selected: Int?) {
            items.clear()
            items.addAll(newItems)
            selectedId = selected
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
            val binding = ItemArtworkOptionBinding.inflate(
                LayoutInflater.from(parent.context), parent, false
            )
            return Holder(binding)
        }

        override fun getItemCount(): Int = items.size

        override fun onBindViewHolder(holder: Holder, position: Int) {
            val option = items[position]
            holder.binding.ivOption.loadThumbnail(option.url, null)
            holder.binding.root.alpha = if (selectedId == option.id) 1f else 0.6f
            holder.binding.root.setOnClickListener { onPick(option) }
        }

        inner class Holder(val binding: ItemArtworkOptionBinding) : RecyclerView.ViewHolder(binding.root)
    }

    companion object {
        private const val ARG_LIST_ID = "list_id"
        private const val ARG_MOVIE_ID = "movie_id"
        private const val ARG_POSTER_ID = "poster_media_id"
        private const val ARG_BACKDROP_ID = "backdrop_media_id"

        fun newInstance(
            listId: Int,
            movieId: Int,
            posterMediaId: Int?,
            backdropMediaId: Int?
        ) = ArtworkSheetFragment().apply {
            arguments = Bundle().apply {
                putInt(ARG_LIST_ID, listId)
                putInt(ARG_MOVIE_ID, movieId)
                putInt(ARG_POSTER_ID, posterMediaId ?: 0)
                putInt(ARG_BACKDROP_ID, backdropMediaId ?: 0)
            }
        }
    }
}
