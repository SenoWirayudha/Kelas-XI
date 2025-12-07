package com.komputerkit.easyshop.model

/**
 * Data class untuk item dalam keranjang belanja
 * 
 * @property product Product yang ditambahkan ke keranjang
 * @property quantity Jumlah/kuantitas produk
 */
data class CartItem(
    val product: ProductModel,
    val quantity: Int = 1
) {
    /**
     * Menghitung total harga untuk item ini (price * quantity)
     */
    fun getTotalPrice(): Double {
        return product.price * quantity
    }
    
    /**
     * Konversi CartItem ke Map untuk disimpan di Firestore
     */
    fun toMap(): Map<String, Any> {
        return mapOf(
            "productId" to product.id,
            "quantity" to quantity,
            "timestamp" to System.currentTimeMillis()
        )
    }
    
    companion object {
        /**
         * Membuat CartItem dari Map (data Firestore) dan ProductModel
         */
        fun fromMap(map: Map<String, Any>, product: ProductModel): CartItem {
            return CartItem(
                product = product,
                quantity = (map["quantity"] as? Number)?.toInt() ?: 1
            )
        }
    }
}
