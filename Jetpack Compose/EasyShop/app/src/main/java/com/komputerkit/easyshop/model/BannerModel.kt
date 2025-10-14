package com.komputerkit.easyshop.model

/**
 * Data class untuk banner carousel di home screen
 * Memetakan dokumen Firestore collection "banners"
 *
 * @property id ID unik banner
 * @property imageUrl URL gambar banner
 * @property title Judul banner (optional)
 * @property link Link tujuan saat banner diklik (optional)
 * @property order Urutan tampilan banner
 */
data class BannerModel(
    val id: String = "",
    val imageUrl: String = "",
    val title: String = "",
    val link: String = "",
    val order: Int = 0
) {
    /**
     * Konversi BannerModel ke Map untuk disimpan di Firestore
     */
    fun toMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "imageUrl" to imageUrl,
            "title" to title,
            "link" to link,
            "order" to order
        )
    }
    
    companion object {
        /**
         * Membuat BannerModel dari Map (data Firestore)
         */
        fun fromMap(map: Map<String, Any>): BannerModel {
            return BannerModel(
                id = map["id"] as? String ?: "",
                imageUrl = map["imageUrl"] as? String ?: "",
                title = map["title"] as? String ?: "",
                link = map["link"] as? String ?: "",
                order = (map["order"] as? Number)?.toInt() ?: 0
            )
        }
    }
}
