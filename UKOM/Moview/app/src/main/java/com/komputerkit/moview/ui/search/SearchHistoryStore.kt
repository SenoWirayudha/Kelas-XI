package com.komputerkit.moview.ui.search

import android.content.Context
import org.json.JSONArray
import org.json.JSONException

/**
 * Local persistence for recent search keywords, scoped per account.
 *
 * Stored in the app's existing "MoviewPrefs" file under `search_history_<userId>`
 * as a JSON array (newest first, max [MAX_ENTRIES], trimmed, case-insensitive
 * unique, no blanks).
 */
object SearchHistoryStore {

    private const val PREFS = "MoviewPrefs"
    private const val KEY_PREFIX = "search_history_"
    const val MAX_ENTRIES = 10

    fun load(context: Context, userId: Int): List<String> {
        val raw = prefs(context).getString(key(userId), null) ?: return emptyList()
        return try {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    val entry = array.optString(i)
                    if (entry.isNotBlank()) add(entry)
                }
            }
        } catch (e: JSONException) {
            emptyList()
        }
    }

    /** Adds (or moves) [keyword] to the top; returns the updated list. */
    fun add(context: Context, userId: Int, keyword: String): List<String> {
        val clean = keyword.trim()
        if (clean.isEmpty()) return load(context, userId)
        val updated = (listOf(clean) + load(context, userId).filterNot {
            it.equals(clean, ignoreCase = true)
        }).take(MAX_ENTRIES)
        save(context, userId, updated)
        return updated
    }

    fun remove(context: Context, userId: Int, keyword: String): List<String> {
        val updated = load(context, userId).filterNot { it.equals(keyword, ignoreCase = true) }
        save(context, userId, updated)
        return updated
    }

    fun clear(context: Context, userId: Int) {
        prefs(context).edit().remove(key(userId)).apply()
    }

    private fun save(context: Context, userId: Int, entries: List<String>) {
        val array = JSONArray()
        entries.forEach { array.put(it) }
        prefs(context).edit().putString(key(userId), array.toString()).apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun key(userId: Int) = "$KEY_PREFIX$userId"
}
