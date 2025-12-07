package com.komputerkit.easyshop.model

/**
 * Data class untuk merepresentasikan data pengguna yang disimpan di Firestore
 *
 * @property uid User ID dari Firebase Authentication
 * @property name Nama lengkap pengguna
 * @property email Email pengguna
 * @property address Alamat pengiriman pengguna
 */
data class UserModel(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val address: String = ""
) {
    /**
     * Konversi UserModel ke Map untuk disimpan di Firestore
     */
    fun toMap(): Map<String, Any> {
        return mapOf(
            "uid" to uid,
            "name" to name,
            "email" to email,
            "address" to address
        )
    }
    
    companion object {
        /**
         * Membuat UserModel dari Map (data Firestore)
         */
        fun fromMap(map: Map<String, Any>): UserModel {
            return UserModel(
                uid = map["uid"] as? String ?: "",
                name = map["name"] as? String ?: "",
                email = map["email"] as? String ?: "",
                address = map["address"] as? String ?: ""
            )
        }
    }
}
