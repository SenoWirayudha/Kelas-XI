package com.komputerkit.moview.ui.common

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.databinding.DialogFilterSheetBinding

data class FilterSheetResult(
    val genre: String? = null,
    val theme: String? = null,
    val language: String? = null,
    val country: String? = null,
    val productionHouse: String? = null,
    val releaseYearChoice: String? = null,
    val ratingChoice: String? = null,
    val year: Int? = null,
    val dateChoice: String? = null
)

data class FilterSheetOptions(
    val genres: List<String> = emptyList(),
    val themes: List<String> = emptyList(),
    val languages: List<String> = emptyList(),
    val countries: List<String> = emptyList(),
    val productionHouses: List<String> = emptyList(),
    val years: List<String> = emptyList(),
    val dateOptions: List<String> = emptyList()
)

class FilterSheetDialog(
    private val context: Context,
    private val options: FilterSheetOptions,
    private val initial: FilterSheetResult,
    private val onApply: (FilterSheetResult) -> Unit,
    private val initialCategory: Category = Category.GENRE
) {

    enum class Category(val label: String) {
        GENRE("Genre"),
        THEME("Theme"),
        LANGUAGE("Language"),
        COUNTRY("Country"),
        PRODUCTION_HOUSE("Production House"),
        RELEASE_YEAR("Release Year"),
        RATING("Rating"),
        YEAR("Year"),
        DATE("Date")
    }

    companion object {
        val RELEASE_YEAR_OPTIONS = listOf("Newest First", "Earliest First")
        val RATING_OPTIONS = listOf(
            "Highest Rated: Average",
            "Highest Rated: Your",
            "Lowest Rated: Average",
            "Lowest Rated: Your"
        )
    }

    private val binding by lazy { DialogFilterSheetBinding.inflate(LayoutInflater.from(context)) }
    private var activeCategory = initialCategory
    private var selection = initial
    private var fullList: List<String> = emptyList()
    private var filteredList: List<String> = emptyList()

    private val androidDialog = android.app.Dialog(
        context,
        android.R.style.Theme_Translucent_NoTitleBar_Fullscreen
    )

    fun show() {
        androidDialog.setContentView(binding.root)
        androidDialog.window?.setLayout(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        androidDialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        setupCategoryChips()
        setupSearch()
        setupList()
        setupActions()

        selectCategory(initialCategory)

        androidDialog.show()
    }

    private fun setupCategoryChips() {
        // Force Inter — same reason as Search chips (style's fontFamily not picked up by Chip)
        val inter = androidx.core.content.res.ResourcesCompat.getFont(context, R.font.font_family_inter)
        listOf(binding.chipGenre, binding.chipTheme, binding.chipLanguage, binding.chipCountry, binding.chipProductionHouse, binding.chipReleaseYear, binding.chipRating, binding.chipYear, binding.chipDate).forEach { it.typeface = inter }

        binding.chipGenre.setOnClickListener { selectCategory(Category.GENRE) }
        binding.chipTheme.setOnClickListener { selectCategory(Category.THEME) }
        binding.chipLanguage.setOnClickListener { selectCategory(Category.LANGUAGE) }
        binding.chipCountry.setOnClickListener { selectCategory(Category.COUNTRY) }
        binding.chipReleaseYear.setOnClickListener { selectCategory(Category.RELEASE_YEAR) }
        binding.chipRating.setOnClickListener { selectCategory(Category.RATING) }
        binding.chipYear.setOnClickListener { selectCategory(Category.YEAR) }
        binding.chipDate.isVisible = options.dateOptions.isNotEmpty()
        binding.chipDate.setOnClickListener { selectCategory(Category.DATE) }
        binding.chipProductionHouse.isVisible = options.productionHouses.isNotEmpty()
        binding.chipProductionHouse.setOnClickListener { selectCategory(Category.PRODUCTION_HOUSE) }
    }

    private fun selectCategory(category: Category) {
        activeCategory = category
        when (category) {
            Category.GENRE -> binding.chipGenre.isChecked = true
            Category.THEME -> binding.chipTheme.isChecked = true
            Category.LANGUAGE -> binding.chipLanguage.isChecked = true
            Category.COUNTRY -> binding.chipCountry.isChecked = true
            Category.RELEASE_YEAR -> binding.chipReleaseYear.isChecked = true
            Category.RATING -> binding.chipRating.isChecked = true
            Category.YEAR -> binding.chipYear.isChecked = true
            Category.DATE -> binding.chipDate.isChecked = true
            Category.PRODUCTION_HOUSE -> binding.chipProductionHouse.isChecked = true
        }
        binding.etSearch.text?.clear()
        binding.etSearch.clearFocus()
        fullList = optionsFor(category)
        filteredList = fullList
        (binding.rvOptions.adapter as? FilterOptionAdapter)?.notifyDataSetChanged()
        binding.rvOptions.scrollToPosition(0)
    }

    private fun optionsFor(category: Category): List<String> = when (category) {
        Category.GENRE -> options.genres
        Category.THEME -> options.themes
        Category.LANGUAGE -> options.languages
        Category.COUNTRY -> options.countries
        Category.RELEASE_YEAR -> RELEASE_YEAR_OPTIONS
        Category.RATING -> RATING_OPTIONS
        Category.YEAR -> options.years
        Category.DATE -> options.dateOptions
        Category.PRODUCTION_HOUSE -> options.productionHouses
    }

    private fun valueFor(category: Category): String? = when (category) {
        Category.GENRE -> selection.genre
        Category.THEME -> selection.theme
        Category.LANGUAGE -> selection.language
        Category.COUNTRY -> selection.country
        Category.RELEASE_YEAR -> selection.releaseYearChoice
        Category.RATING -> selection.ratingChoice
        Category.YEAR -> selection.year?.toString()
        Category.DATE -> selection.dateChoice
        Category.PRODUCTION_HOUSE -> selection.productionHouse
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val query = s?.toString()?.trim()?.lowercase() ?: ""
                filteredList = if (query.isEmpty()) {
                    fullList
                } else {
                    fullList.filter { it.lowercase().contains(query) }
                }
                (binding.rvOptions.adapter as? FilterOptionAdapter)?.notifyDataSetChanged()
            }
        })
    }

    private fun setupList() {
        binding.rvOptions.layoutManager = LinearLayoutManager(context)
        binding.rvOptions.adapter = FilterOptionAdapter()
    }

    private fun setupActions() {
        binding.btnClose.setOnClickListener { androidDialog.dismiss() }
        binding.btnClear.setOnClickListener {
            selection = FilterSheetResult()
            (binding.rvOptions.adapter as? FilterOptionAdapter)?.notifyDataSetChanged()
        }
        binding.btnApply.setOnClickListener {
            onApply(selection)
            androidDialog.dismiss()
        }
    }

    private fun setValueFor(category: Category, value: String?) {
        selection = when (category) {
            Category.GENRE -> selection.copy(genre = value)
            Category.THEME -> selection.copy(theme = value)
            Category.LANGUAGE -> selection.copy(language = value)
            Category.COUNTRY -> selection.copy(country = value)
            Category.RELEASE_YEAR -> selection.copy(releaseYearChoice = value)
            Category.RATING -> selection.copy(ratingChoice = value)
            Category.YEAR -> selection.copy(year = value?.toIntOrNull())
            Category.DATE -> selection.copy(dateChoice = value)
            Category.PRODUCTION_HOUSE -> selection.copy(productionHouse = value)
        }
    }

    private inner class FilterOptionAdapter :
        RecyclerView.Adapter<FilterOptionAdapter.ViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_filter_option, parent, false)
            return ViewHolder(view)
        }

        override fun getItemCount(): Int = filteredList.size

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val value = filteredList[position]
            val selected = value == valueFor(activeCategory)
            holder.binding.tvOption.text = value
            holder.binding.tvOption.setTextColor(
                holder.itemView.context.getColor(
                    if (selected) com.komputerkit.moview.R.color.accent_blue
                    else com.komputerkit.moview.R.color.text_primary
                )
            )
            holder.binding.ivCheck.visibility =
                if (selected) View.VISIBLE else View.INVISIBLE
            holder.itemView.setOnClickListener {
                val next = if (selected) null else value
                setValueFor(activeCategory, next)
                notifyDataSetChanged()
            }
        }

        inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            val binding = com.komputerkit.moview.databinding.ItemFilterOptionBinding.bind(itemView)
        }
    }
}