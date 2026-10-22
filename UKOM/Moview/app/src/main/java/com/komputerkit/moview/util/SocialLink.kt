package com.komputerkit.moview.util

import com.komputerkit.moview.R
import java.net.URI
import java.net.URLDecoder

data class SocialLinkValidation(val url: String?, val error: String?)

data class SocialLinkInfo(val url: String, val label: String, val iconRes: Int)

/**
 * Validates the optional "Social Link" profile field and turns a stored link
 * into the icon + handle shown on the profile screen.
 */
object SocialLink {

    private const val MAX_LENGTH = 100

    private val platformIcons = listOf(
        "instagram.com" to R.drawable.ic_social_instagram,
        "tiktok.com" to R.drawable.ic_social_tiktok,
        "x.com" to R.drawable.ic_social_x,
        "twitter.com" to R.drawable.ic_social_x,
        "youtube.com" to R.drawable.ic_social_youtube,
        "youtu.be" to R.drawable.ic_social_youtube,
        "facebook.com" to R.drawable.ic_social_facebook,
        "fb.com" to R.drawable.ic_social_facebook,
        "threads.net" to R.drawable.ic_social_threads,
        "threads.com" to R.drawable.ic_social_threads,
        "linkedin.com" to R.drawable.ic_social_linkedin,
        "github.com" to R.drawable.ic_social_github
    )

    private val hostPattern =
        Regex("^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}$")

    private val reservedSegments = setOf(
        "watch", "playlist", "results", "search", "shorts", "share", "home",
        "feed", "hashtag", "channel", "c", "user", "video", "embed", "status",
        "statuses", "intent", "i", "p", "reel", "reels", "stories", "explore",
        "profile.php", "permalink.php", "story.php", "photo.php", "groups",
        "people", "login", "signup", "about", "privacy", "tos", "help",
        "settings", "accounts", "direct", "notifications", "inbox"
    )

    /**
     * Blank input is valid (clears the field). Anything else is normalized to
     * an absolute http/https URL; other schemes and non-URLs are rejected.
     */
    fun validateAndNormalize(input: String): SocialLinkValidation {
        val trimmed = input.trim()
        if (trimmed.isEmpty()) return SocialLinkValidation(null, null)
        if (trimmed.length > MAX_LENGTH) {
            return SocialLinkValidation(null, "Link maksimal $MAX_LENGTH karakter")
        }

        val candidate = when {
            trimmed.startsWith("http://", ignoreCase = true) ||
                trimmed.startsWith("https://", ignoreCase = true) -> trimmed
            trimmed.contains("://") -> return SocialLinkValidation(null, invalidSchemeMessage)
            trimmed.startsWith("//") -> "https:$trimmed"
            else -> "https://$trimmed"
        }

        val uri = try {
            URI(candidate)
        } catch (e: Exception) {
            return SocialLinkValidation(null, invalidMessage)
        }

        val scheme = uri.scheme?.lowercase()
        if (scheme != "http" && scheme != "https") {
            return SocialLinkValidation(null, invalidSchemeMessage)
        }

        val host = uri.host?.lowercase()
        if (host == null || !hostPattern.matches(host)) {
            return SocialLinkValidation(null, invalidMessage)
        }

        val normalized = buildString {
            append(scheme)
            append("://")
            append(uri.rawAuthority)
            append(uri.rawPath ?: "")
            uri.rawQuery?.let { append('?').append(it) }
        }

        if (normalized.length > MAX_LENGTH) {
            return SocialLinkValidation(null, "Link maksimal $MAX_LENGTH karakter")
        }

        return SocialLinkValidation(normalized, null)
    }

    /** Null when there is nothing (or nothing usable) to display. */
    fun parse(raw: String?): SocialLinkInfo? {
        val trimmed = raw?.trim().orEmpty()
        if (trimmed.isEmpty()) return null

        val candidate = if (trimmed.contains("://")) trimmed else "https://$trimmed"
        val uri = try {
            URI(candidate)
        } catch (e: Exception) {
            return null
        }

        val scheme = uri.scheme?.lowercase()
        if (scheme != "http" && scheme != "https") return null

        val host = uri.host?.lowercase()
            ?.removePrefix("www.")
            ?.removePrefix("m.")
            ?.removePrefix("mobile.")
            ?: return null
        if (host.isEmpty()) return null

        val segments = (uri.rawPath ?: "")
            .split('/')
            .filter { it.isNotBlank() }
            .map { decodeSegment(it) }

        val icon = platformIcon(host)
        val username = if (icon != null) extractUsername(host, segments) else null
        return SocialLinkInfo(
            url = candidate,
            label = username?.let { "@$it" } ?: host,
            iconRes = icon ?: R.drawable.ic_link
        )
    }

    private fun extractUsername(host: String, segments: List<String>): String? {
        var index = 0
        if (host == "linkedin.com" || host.endsWith(".linkedin.com")) {
            if (segments.getOrNull(0)?.lowercase() in setOf("in", "company", "school", "pub")) {
                index = 1
            }
        }

        val segment = segments.getOrNull(index) ?: return null
        val cleaned = segment.trim().trimStart('@')
        if (cleaned.isEmpty()) return null
        if (!segment.startsWith("@") && cleaned.lowercase() in reservedSegments) return null
        if (cleaned.any { it.isWhitespace() }) return null
        return cleaned
    }

    private fun platformIcon(host: String): Int? {
        platformIcons.firstOrNull { (domain, _) ->
            host == domain || host.endsWith(".$domain")
        }?.let { return it.second }
        return null
    }

    private fun decodeSegment(value: String): String = try {
        URLDecoder.decode(value, "UTF-8")
    } catch (e: Exception) {
        value
    }

    private const val invalidSchemeMessage = "Link harus memakai http atau https"
    private const val invalidMessage = "Link tidak valid. Gunakan format instagram.com/username"
}
