package com.komputerkit.socialmediaapp.activity

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.View
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.firebase.firestore.ListenerRegistration
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.adapter.SearchAdapter
import com.komputerkit.socialmediaapp.adapter.SearchHistoryAdapter
import com.komputerkit.socialmediaapp.base.BaseActivity
import com.komputerkit.socialmediaapp.databinding.ActivitySearchBinding
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.model.SearchHistory
import com.komputerkit.socialmediaapp.model.SearchType
import com.komputerkit.socialmediaapp.model.User
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.utils.SearchHistoryManager

class SearchActivity : BaseActivity() {

    private lateinit var binding: ActivitySearchBinding
    private lateinit var searchAdapter: SearchAdapter
    private lateinit var searchHistoryAdapter: SearchHistoryAdapter
    private lateinit var searchHistoryManager: SearchHistoryManager
    
    private var searchListener: ListenerRegistration? = null
    private var isShowingHistory = true
    
    companion object {
        const val EXTRA_SEARCH_QUERY = "search_query"
        const val EXTRA_SEARCH_TYPE = "search_type"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySearchBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupRecyclerView()
        setupSearch()
        setupBottomNavigation(R.id.nav_search)
        
        // Clear any existing partial search history from previous versions
        clearOldSearchHistory()
        
        // Check if launched with hashtag search intent
        val searchQuery = intent.getStringExtra(EXTRA_SEARCH_QUERY)
        val searchType = intent.getStringExtra(EXTRA_SEARCH_TYPE)
        
        Log.d("SearchActivity", "Received search query: '$searchQuery', type: '$searchType'")
        
        if (!searchQuery.isNullOrEmpty()) {
            // Set search query and perform search
            binding.searchEditText.setText(searchQuery)
            showSearchResults()
            performSearch(searchQuery)
        } else {
            // Show search history after all adapters are initialized
            showSearchHistory()
        }
    }

    private fun setupUI() {
        // firebaseRepository inherited from BaseActivity
        searchHistoryManager = SearchHistoryManager(this)
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun setupRecyclerView() {
        // Search results adapter
        searchAdapter = SearchAdapter(
            users = emptyList(),
            posts = emptyList(),
            onUserClick = { user -> openUserProfile(user) },
            onPostClick = { post -> openPostDetail(post) }
        )
        
        // Search history adapter
        searchHistoryAdapter = SearchHistoryAdapter(
            searchHistory = emptyList(),
            onHistoryClick = { history -> useSearchHistory(history) },
            onDeleteClick = { history -> deleteSearchHistory(history) }
        )
        
        binding.searchRecyclerView.layoutManager = LinearLayoutManager(this)
    }

    private fun setupSearch() {
        binding.searchEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            
            override fun afterTextChanged(s: Editable?) {
                val query = s?.toString()?.trim() ?: ""
                if (query.isNotEmpty()) {
                    showSearchResults()
                    performSearch(query)
                } else {
                    showSearchHistory()
                }
            }
        })

        binding.clearSearchButton.setOnClickListener {
            binding.searchEditText.text?.clear()
        }
    }

    private fun performSearch(query: String) {
        Log.d("SearchActivity", "Performing search for query: '$query'")
        binding.progressBar.visibility = View.VISIBLE
        binding.noResultsText.visibility = View.GONE
        
        searchListener?.remove()
        
        if (query.startsWith("#")) {
            // Search for hashtags in posts
            val hashtag = query.substring(1)
            Log.d("SearchActivity", "Searching hashtag: '$hashtag'")
            // Don't save to history during typing, only when user clicks result
            searchHashtags(hashtag)
        } else {
            // Search for users
            Log.d("SearchActivity", "Searching users: '$query'")
            // Don't save to history during typing, only when user clicks result
            searchUsers(query)
        }
    }

    private fun searchUsers(query: String) {
        searchListener = firebaseRepository.searchUsers(query) { users ->
            runOnUiThread {
                binding.progressBar.visibility = View.GONE
                if (users.isEmpty()) {
                    binding.noResultsText.visibility = View.VISIBLE
                    binding.noResultsText.text = "No users found for '$query'"
                } else {
                    binding.noResultsText.visibility = View.GONE
                }
                searchAdapter.updateResults(users, emptyList())
            }
        }
    }

    private fun searchHashtags(hashtag: String) {
        Log.d("SearchActivity", "searchHashtags called with hashtag: '$hashtag'")
        searchListener = firebaseRepository.searchPostsByHashtag(hashtag) { posts ->
            Log.d("SearchActivity", "searchPostsByHashtag returned ${posts.size} posts")
            runOnUiThread {
                binding.progressBar.visibility = View.GONE
                if (posts.isEmpty()) {
                    // Jika primary search gagal atau tidak ada hasil, coba debug method
                    Log.d("SearchActivity", "Primary search returned 0 results, trying debug method")
                    searchHashtagsDebug(hashtag)
                } else {
                    binding.noResultsText.visibility = View.GONE
                    searchAdapter.updateResults(emptyList(), posts)
                }
            }
        }
    }
    
    private fun searchHashtagsDebug(hashtag: String) {
        Log.d("SearchActivity", "searchHashtagsDebug called with hashtag: '$hashtag'")
        searchListener?.remove()
        searchListener = firebaseRepository.searchPostsByHashtagDebug(hashtag) { posts ->
            Log.d("SearchActivity", "searchPostsByHashtagDebug returned ${posts.size} posts")
            runOnUiThread {
                binding.progressBar.visibility = View.GONE
                if (posts.isEmpty()) {
                    binding.noResultsText.visibility = View.VISIBLE
                    binding.noResultsText.text = "No posts found for '#$hashtag'"
                } else {
                    binding.noResultsText.visibility = View.GONE
                }
                searchAdapter.updateResults(emptyList(), posts)
            }
        }
    }

    private fun showSearchHistory() {
        isShowingHistory = true
        binding.progressBar.visibility = View.GONE
        binding.noResultsText.visibility = View.GONE
        binding.searchRecyclerView.adapter = searchHistoryAdapter
        
        val history = searchHistoryManager.getSearchHistory()
        if (history.isEmpty()) {
            binding.noResultsText.visibility = View.VISIBLE
            binding.noResultsText.text = "No search history yet"
        }
        searchHistoryAdapter.updateHistory(history)
    }

    private fun showSearchResults() {
        isShowingHistory = false
        binding.searchRecyclerView.adapter = searchAdapter
    }

    private fun useSearchHistory(history: SearchHistory) {
        val query = if (history.type == SearchType.HASHTAG) "#${history.query}" else history.query
        binding.searchEditText.setText(query)
        binding.searchEditText.setSelection(query.length)
    }

    private fun deleteSearchHistory(history: SearchHistory) {
        searchHistoryManager.removeSearchQuery(history.query)
        showSearchHistory()
    }

    private fun clearOldSearchHistory() {
        // Clear partial search queries that might have been saved from previous versions
        val history = searchHistoryManager.getSearchHistory()
        val validHistory = history.filter { 
            it.query.length >= 3 // Keep only queries with 3+ characters
        }
        
        // If we filtered out some entries, save the cleaned history
        if (validHistory.size != history.size) {
            searchHistoryManager.clearSearchHistory()
            validHistory.forEach { 
                searchHistoryManager.addSearchQuery(it.query, it.type)
            }
        }
    }

    private fun openUserProfile(user: User) {
        Log.d("SearchActivity", "Opening profile for user: ${user.username} with ID: ${user.id}")
        
        // Add user to search history when their profile is opened
        searchHistoryManager.addSearchQuery(user.username, SearchType.USER)
        
        val intent = Intent(this, ProfileActivity::class.java)
        intent.putExtra("userId", user.id)
        startActivity(intent)
    }

    private fun openPostDetail(post: Post) {
        // Save hashtag to history if this was from a hashtag search
        val currentQuery = binding.searchEditText.text?.toString()?.trim()
        if (!currentQuery.isNullOrEmpty() && currentQuery.startsWith("#")) {
            val hashtag = currentQuery.substring(1)
            searchHistoryManager.addSearchQuery(hashtag, SearchType.HASHTAG)
        }
        
        // TODO: Navigate to post detail
        // val intent = Intent(this, PostDetailActivity::class.java)
        // intent.putExtra("postId", post.id)
        // startActivity(intent)
    }

    override fun onResume() {
        super.onResume()
        // Refresh search history when returning to this activity
        if (isShowingHistory) {
            showSearchHistory()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        searchListener?.remove()
    }
}
