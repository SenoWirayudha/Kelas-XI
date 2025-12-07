package com.komputerkit.newsnow.utils

object Constants {
    
    // News API Configuration
    const val BASE_URL = "https://newsapi.org/v2/"
    const val API_KEY = "3446f3ac372f4603bf1625ce6ea6e376" // Ganti dengan API key dari newsapi.org
    
    // Default values
    const val DEFAULT_COUNTRY = "us"
    const val DEFAULT_PAGE_SIZE = 20
    const val DEFAULT_SORT_BY = "publishedAt"
    
    // Network timeout (reduced for faster response)
    const val CONNECT_TIMEOUT = 10L
    const val READ_TIMEOUT = 15L
    
    // WebView user agent
    const val WEB_VIEW_USER_AGENT = "NewsNow Android App"
}