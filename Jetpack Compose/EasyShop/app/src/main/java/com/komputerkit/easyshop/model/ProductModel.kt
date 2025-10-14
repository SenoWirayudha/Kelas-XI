package com.komputerkit.easyshop.model

/**
 * Data class untuk produk yang dijual di aplikasi
 * Memetakan dokumen Firestore collection "products"
 *
 * @property id ID unik produk (document ID di Firestore)
 * @property title Judul/nama produk
 * @property description Deskripsi detail produk
 * @property price Harga jual saat ini (setelah diskon jika ada)
 * @property actualPrice Harga asli sebelum diskon
 * @property category Kategori produk (Film, Buku, dll)
 * @property images List URL gambar produk
 */
data class ProductModel(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val price: Double = 0.0,
    val actualPrice: Double = 0.0,
    val category: String = "",
    val images: List<String> = emptyList()
) {
    /**
     * Konversi ProductModel ke Map untuk disimpan di Firestore
     */
    fun toMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "title" to title,
            "description" to description,
            "price" to price,
            "actualPrice" to actualPrice,
            "category" to category,
            "images" to images
        )
    }
    
    /**
     * Menghitung persentase diskon jika ada
     */
    fun getDiscountPercentage(): Int {
        if (actualPrice <= 0.0 || price >= actualPrice) return 0
        return (((actualPrice - price) / actualPrice) * 100).toInt()
    }
    
    /**
     * Cek apakah produk sedang diskon
     */
    fun hasDiscount(): Boolean {
        return price < actualPrice && actualPrice > 0.0
    }
    
    companion object {
        /**
         * Membuat ProductModel dari Map (data Firestore)
         */
        fun fromMap(map: Map<String, Any>): ProductModel {
            return ProductModel(
                id = map["id"] as? String ?: "",
                title = map["title"] as? String ?: "",
                description = map["description"] as? String ?: "",
                price = (map["price"] as? Number)?.toDouble() ?: 0.0,
                actualPrice = (map["actualPrice"] as? Number)?.toDouble() ?: 0.0,
                category = map["category"] as? String ?: "",
                images = (map["images"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
            )
        }
    }
}
