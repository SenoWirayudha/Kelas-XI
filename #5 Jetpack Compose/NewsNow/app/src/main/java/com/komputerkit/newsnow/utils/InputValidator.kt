package com.komputerkit.newsnow.utils

object InputValidator {
    
    /**
     * Validate dan sanitize search query
     */
    fun validateSearchQuery(query: String): ValidationResult {
        val trimmed = query.trim()
        
        return when {
            trimmed.isEmpty() -> ValidationResult.Error("Search query cannot be empty")
            trimmed.length < 2 -> ValidationResult.Error("Please enter at least 2 characters")
            trimmed.length > 100 -> ValidationResult.Error("Search query too long (max 100 characters)")
            containsOnlySpecialChars(trimmed) -> ValidationResult.Error("Please enter valid keywords")
            else -> ValidationResult.Success(sanitizeQuery(trimmed))
        }
    }
    
    /**
     * Sanitize query untuk prevent injection dan invalid characters
     */
    private fun sanitizeQuery(query: String): String {
        return query
            .replace(Regex("[<>\"']"), "") // Remove potentially harmful characters
            .replace(Regex("\\s+"), " ") // Normalize whitespace
            .trim()
            .take(100) // Enforce max length
    }
    
    /**
     * Check jika query hanya mengandung special characters
     */
    private fun containsOnlySpecialChars(query: String): Boolean {
        return query.all { !it.isLetterOrDigit() }
    }
    
    /**
     * Validate URL untuk WebView
     */
    fun validateUrl(url: String): ValidationResult {
        val trimmed = url.trim()
        
        return when {
            trimmed.isEmpty() -> ValidationResult.Error("URL cannot be empty")
            !trimmed.startsWith("http://") && !trimmed.startsWith("https://") -> 
                ValidationResult.Error("Invalid URL format")
            trimmed.length > 2000 -> ValidationResult.Error("URL too long")
            else -> ValidationResult.Success(trimmed)
        }
    }
    
    /**
     * Sanitize article title untuk display
     */
    fun sanitizeTitle(title: String): String {
        return title
            .replace(Regex("[<>]"), "")
            .trim()
            .take(200) // Max title length
    }
    
    /**
     * Sanitize description untuk display
     */
    fun sanitizeDescription(description: String?): String? {
        return description?.let {
            it.replace(Regex("[<>]"), "")
                .trim()
                .take(500) // Max description length
        }
    }
}

sealed class ValidationResult {
    data class Success(val value: String) : ValidationResult()
    data class Error(val message: String) : ValidationResult()
}
