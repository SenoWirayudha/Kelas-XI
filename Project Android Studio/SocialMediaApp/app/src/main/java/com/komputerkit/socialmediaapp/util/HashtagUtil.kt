package com.komputerkit.socialmediaapp.util

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.text.Spannable
import android.text.SpannableString
import android.text.TextPaint
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.view.View
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.activity.SearchActivity

/**
 * HashtagUtil - Utility untuk handle hashtag styling dan click functionality
 * Membuat hashtag berwarna biru seperti Instagram dan dapat diklik
 */
object HashtagUtil {
    
    /**
     * Setup hashtag links dalam TextView
     * @param textView TextView yang akan di-setup
     * @param text Text yang mengandung hashtag
     * @param context Context untuk navigation
     */
    fun setupHashtagLinks(textView: TextView, text: String, context: Context) {
        val spannableString = SpannableString(text)
        val hashtags = extractHashtagsWithPositions(text)
        
        // Set warna default text
        textView.setTextColor(ContextCompat.getColor(context, android.R.color.black))
        
        hashtags.forEach { hashtagInfo ->
            val clickableSpan = object : ClickableSpan() {
                override fun onClick(widget: View) {
                    // Navigate to search activity with hashtag
                    navigateToHashtagSearch(context, hashtagInfo.hashtag)
                }
                
                override fun updateDrawState(ds: TextPaint) {
                    super.updateDrawState(ds)
                    // Instagram blue color untuk hashtag
                    ds.color = Color.parseColor("#1877F2") // Instagram blue
                    ds.isUnderlineText = false // Hilangkan underline
                }
            }
            
            spannableString.setSpan(
                clickableSpan,
                hashtagInfo.start,
                hashtagInfo.end,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        
        textView.text = spannableString
        textView.movementMethod = LinkMovementMethod.getInstance()
        textView.highlightColor = Color.TRANSPARENT // Hilangkan highlight saat klik
    }
    
    /**
     * Extract hashtags dari text dengan posisi start dan end
     */
    private fun extractHashtagsWithPositions(text: String): List<HashtagInfo> {
        val hashtags = mutableListOf<HashtagInfo>()
        val words = text.split("\\s+".toRegex())
        var currentPosition = 0
        
        words.forEach { word ->
            val wordStart = text.indexOf(word, currentPosition)
            
            if (word.startsWith("#") && word.length > 1) {
                // Extract hashtag tanpa simbol #
                val hashtag = word.substring(1).replace(Regex("[^a-zA-Z0-9_]"), "")
                
                if (hashtag.isNotEmpty()) {
                    hashtags.add(
                        HashtagInfo(
                            hashtag = hashtag,
                            start = wordStart,
                            end = wordStart + word.length
                        )
                    )
                }
            }
            
            currentPosition = wordStart + word.length
        }
        
        return hashtags
    }
    
    /**
     * Navigate ke SearchActivity dengan hashtag query
     */
    private fun navigateToHashtagSearch(context: Context, hashtag: String) {
        val intent = Intent(context, SearchActivity::class.java).apply {
            putExtra(SearchActivity.EXTRA_SEARCH_QUERY, "#$hashtag")
            putExtra(SearchActivity.EXTRA_SEARCH_TYPE, "hashtag")
        }
        context.startActivity(intent)
    }
    
    /**
     * Extract hashtag list dari text (untuk simpan ke database)
     */
    fun extractHashtagsList(text: String): List<String> {
        val hashtags = mutableListOf<String>()
        val words = text.split("\\s+".toRegex())
        
        words.forEach { word ->
            if (word.startsWith("#") && word.length > 1) {
                val hashtag = word.substring(1)
                    .replace(Regex("[^a-zA-Z0-9_]"), "")
                    .lowercase()
                
                if (hashtag.isNotEmpty() && !hashtags.contains(hashtag)) {
                    hashtags.add(hashtag)
                }
            }
        }
        
        return hashtags
    }
    
    /**
     * Data class untuk menyimpan informasi hashtag dengan posisi
     */
    private data class HashtagInfo(
        val hashtag: String,
        val start: Int,
        val end: Int
    )
}
