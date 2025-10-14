package com.komputerkit.newsnow.navigation

object Routes {
    const val HOME = "home"
    const val ARTICLE_DETAIL = "article_detail"
    
    fun articleDetail(articleUrl: String): String {
        return "$ARTICLE_DETAIL/$articleUrl"
    }
}