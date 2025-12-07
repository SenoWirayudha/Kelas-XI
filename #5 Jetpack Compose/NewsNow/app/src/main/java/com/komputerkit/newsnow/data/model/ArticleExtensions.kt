package com.komputerkit.newsnow.data.model

import com.komputerkit.newsnow.utils.InputValidator

/**
 * Extension functions untuk safe data access
 */

/**
 * Get safe title (never null or empty)
 */
fun Article.getSafeTitle(): String {
    return InputValidator.sanitizeTitle(
        this.title.takeIf { it.isNotBlank() } ?: "Untitled Article"
    )
}

/**
 * Get safe description (nullable, but sanitized)
 */
fun Article.getSafeDescription(): String? {
    return InputValidator.sanitizeDescription(this.description)
}

/**
 * Get safe URL (validated)
 */
fun Article.getSafeUrl(): String? {
    return if (this.url.isNotBlank()) {
        this.url
    } else {
        null
    }
}

/**
 * Get safe image URL (validated)
 */
fun Article.getSafeImageUrl(): String? {
    return this.urlToImage?.takeIf { 
        it.isNotBlank() && (it.startsWith("http://") || it.startsWith("https://"))
    }
}

/**
 * Get safe source name
 */
fun Article.getSafeSourceName(): String {
    return this.source.name.takeIf { it.isNotBlank() } ?: "Unknown Source"
}

/**
 * Get safe author name
 */
fun Article.getSafeAuthor(): String? {
    return this.author?.takeIf { it.isNotBlank() }
}

/**
 * Check if article has valid data
 */
fun Article.isValid(): Boolean {
    return this.title.isNotBlank() && 
           this.url.isNotBlank() &&
           this.source.name.isNotBlank()
}