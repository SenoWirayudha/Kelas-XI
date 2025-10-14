package com.komputerkit.easyshop.model

/**
 * Data class untuk kategori produk
 *
 * @property id ID unik kategori
 * @property name Nama kategori
 * @property imageUrl URL gambar kategori
 */
data class CategoryModel(
    val id: String = "",
    val name: String = "",
    val imageUrl: String = ""
) {
    /**
     * Konversi CategoryModel ke Map untuk disimpan di Firestore
     */
    fun toMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "name" to name,
            "imageUrl" to imageUrl
        )
    }
    
    companion object {
        /**
         * Membuat CategoryModel dari Map (data Firestore)
         */
        fun fromMap(map: Map<String, Any>): CategoryModel {
            return CategoryModel(
                id = map["id"] as? String ?: "",
                name = map["name"] as? String ?: "",
                imageUrl = map["imageUrl"] as? String ?: ""
            )
        }
    }
}
