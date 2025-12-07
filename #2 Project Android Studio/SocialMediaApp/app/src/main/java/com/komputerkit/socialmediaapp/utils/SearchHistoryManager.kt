package com.komputerkit.socialmediaapp.utils

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.komputerkit.socialmediaapp.model.SearchHistory
import com.komputerkit.socialmediaapp.model.SearchType

class SearchHistoryManager(context: Context) {
    
    private val sharedPreferences: SharedPreferences = 
        context.getSharedPreferences("search_history", Context.MODE_PRIVATE)
    private val gson = Gson()
    
    companion object {
        private const val KEY_SEARCH_HISTORY = "search_history_list"
        private const val MAX_HISTORY_SIZE = 10
    }
    
    fun addSearchQuery(query: String, type: SearchType) {
        val history = getSearchHistory().toMutableList()
        
        // Remove existing query if exists
        history.removeAll { it.query.equals(query, ignoreCase = true) }
        
        // Add new query at the beginning
        history.add(0, SearchHistory(query, System.currentTimeMillis(), type))
        
        // Keep only recent queries
        if (history.size > MAX_HISTORY_SIZE) {
            history.removeAt(history.size - 1)
        }
        
        saveSearchHistory(history)
    }
    
    fun getSearchHistory(): List<SearchHistory> {
        val json = sharedPreferences.getString(KEY_SEARCH_HISTORY, null)
        return if (json != null) {
            try {
                val type = object : TypeToken<List<SearchHistory>>() {}.type
                gson.fromJson(json, type) ?: emptyList()
            } catch (e: Exception) {
                emptyList()
            }
        } else {
            emptyList()
        }
    }
    
    fun clearSearchHistory() {
        sharedPreferences.edit().remove(KEY_SEARCH_HISTORY).apply()
    }
    
    fun removeSearchQuery(query: String) {
        val history = getSearchHistory().toMutableList()
        history.removeAll { it.query.equals(query, ignoreCase = true) }
        saveSearchHistory(history)
    }
    
    private fun saveSearchHistory(history: List<SearchHistory>) {
        val json = gson.toJson(history)
        sharedPreferences.edit().putString(KEY_SEARCH_HISTORY, json).apply()
    }
}
