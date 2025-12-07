package com.komputerkit.newsnow.utils

import android.content.Context
import android.content.SharedPreferences

class PreferencesManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )
    
    companion object {
        private const val PREFS_NAME = "newsnow_prefs"
        private const val KEY_LAST_CATEGORY = "last_category"
        private const val KEY_LAST_SEARCH_QUERY = "last_search_query"
        private const val KEY_IS_FIRST_LAUNCH = "is_first_launch"
    }
    
    /**
     * Save last selected category
     */
    fun saveLastCategory(category: String?) {
        prefs.edit().putString(KEY_LAST_CATEGORY, category).apply()
    }
    
    /**
     * Get last selected category
     */
    fun getLastCategory(): String? {
        return prefs.getString(KEY_LAST_CATEGORY, null)
    }
    
    /**
     * Save last search query
     */
    fun saveLastSearchQuery(query: String) {
        prefs.edit().putString(KEY_LAST_SEARCH_QUERY, query).apply()
    }
    
    /**
     * Get last search query
     */
    fun getLastSearchQuery(): String? {
        return prefs.getString(KEY_LAST_SEARCH_QUERY, null)
    }
    
    /**
     * Check if first launch
     */
    fun isFirstLaunch(): Boolean {
        val isFirst = prefs.getBoolean(KEY_IS_FIRST_LAUNCH, true)
        if (isFirst) {
            prefs.edit().putBoolean(KEY_IS_FIRST_LAUNCH, false).apply()
        }
        return isFirst
    }
    
    /**
     * Clear all preferences
     */
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}