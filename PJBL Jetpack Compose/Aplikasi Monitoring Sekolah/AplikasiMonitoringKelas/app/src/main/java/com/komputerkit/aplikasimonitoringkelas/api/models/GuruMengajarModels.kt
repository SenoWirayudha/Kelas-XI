package com.komputerkit.aplikasimonitoringkelas.api.models

import com.google.gson.annotations.SerializedName

// Request untuk POST /api/guru-mengajar/by-hari-kelas
data class GuruMengajarByHariKelasRequest(
    @SerializedName("hari")
    val hari: String,
    
    @SerializedName("kelas_id")
    val kelasId: Int
)

// Data guru mengajar untuk response
data class GuruMengajarData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("jadwal_id")
    val jadwalId: Int,
    
    @SerializedName("nama_guru")
    val namaGuru: String,
    
    @SerializedName("mapel")
    val mapel: String,
    
    @SerializedName("jam_ke")
    val jamKe: String,
    
    @SerializedName("status")
    val status: String,
    
    @SerializedName("keterangan")
    val keterangan: String?
)

// Response wrapper untuk list guru mengajar
data class GuruMengajarListResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: List<GuruMengajarData>
)

// Request untuk UPDATE guru mengajar (PUT /guru-mengajars/{id})
data class UpdateGuruMengajarRequest(
    @SerializedName("status")
    val status: String,
    
    @SerializedName("keterangan")
    val keterangan: String?
)

// Response untuk single guru mengajar operation
data class GuruMengajarResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: GuruMengajarData?
)

// Response untuk delete operation
data class DeleteResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String
)
