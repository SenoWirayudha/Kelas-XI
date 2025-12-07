package com.komputerkit.newsnow.utils

import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object UrlUtils {
    
    fun encodeUrl(url: String): String {
        return try {
            URLEncoder.encode(url, StandardCharsets.UTF_8.toString())
        } catch (e: Exception) {
            url
        }
    }
    
    fun decodeUrl(encodedUrl: String): String {
        return try {
            URLDecoder.decode(encodedUrl, StandardCharsets.UTF_8.toString())
        } catch (e: Exception) {
            encodedUrl
        }
    }
}