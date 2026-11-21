package com.komputerkit.moview.util

import android.os.Build
import android.text.Html
import android.util.LruCache

/**
 * Small LRU cache for decoded review HTML.
 *
 * `Html.fromHtml` is one of the most expensive calls in the review rows and it
 * used to run on every bind (and again on every spoiler tap). Decoding once per
 * distinct source string makes scrolling back through a long review list cheap.
 */
object HtmlText {

    private val cache = LruCache<String, CharSequence>(300)

    /** Decode HTML (or plain text) to a Spanned, memoised by the raw string. */
    fun decode(raw: String): CharSequence {
        cache.get(raw)?.let { return it }
        val decoded = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Html.fromHtml(raw, Html.FROM_HTML_MODE_COMPACT)
        } else {
            @Suppress("DEPRECATION")
            Html.fromHtml(raw)
        }
        cache.put(raw, decoded)
        return decoded
    }

    /**
     * Some payloads are double-encoded ("&amp;#128512;"): decode twice and keep
     * the result as plain text. Memoised by the raw string as well.
     */
    fun decodeToString(raw: String): CharSequence {
        cache.get(raw)?.let { return it }
        var decoded = raw
        repeat(2) {
            val next = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                Html.fromHtml(decoded, Html.FROM_HTML_MODE_COMPACT).toString()
            } else {
                @Suppress("DEPRECATION")
                Html.fromHtml(decoded).toString()
            }
            if (next == decoded) {
                cache.put(raw, decoded)
                return decoded
            }
            decoded = next
        }
        cache.put(raw, decoded)
        return decoded
    }

    /** Exposed for tests/diagnostics: number of cached entries. */
    fun size(): Int = cache.size()
}
