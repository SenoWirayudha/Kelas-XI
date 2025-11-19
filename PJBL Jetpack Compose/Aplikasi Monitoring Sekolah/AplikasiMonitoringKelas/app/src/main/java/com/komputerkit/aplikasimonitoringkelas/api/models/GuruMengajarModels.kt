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
    
    @SerializedName("guru_pengganti")
    val guruPengganti: String?,
    
    @SerializedName("izin_mulai")
    val izinMulai: String?,
    
    @SerializedName("izin_selesai")
    val izinSelesai: String?,
    
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
    @SerializedName("guru_pengganti_id")
    val guruPenggantiId: Int?,
    
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

// ==================== KELAS KOSONG MODELS ====================

// Request untuk POST /api/guru-mengajar/kelas-kosong
data class KelasKosongRequest(
    @SerializedName("hari")
    val hari: String
)

// Data untuk kelas kosong (guru tidak masuk/izin)
data class KelasKosongData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("jadwal_id")
    val jadwalId: Int,
    
    @SerializedName("kelas_id")
    val kelasId: Int,
    
    @SerializedName("kelas_nama")
    val kelasNama: String,
    
    @SerializedName("guru_id")
    val guruId: Int,
    
    @SerializedName("guru_nama")
    val guruNama: String,
    
    @SerializedName("mapel_id")
    val mapelId: Int,
    
    @SerializedName("mapel_nama")
    val mapelNama: String,
    
    @SerializedName("jam_ke")
    val jamKe: String,
    
    @SerializedName("status")
    val status: String,  // tidak_masuk atau izin
    
    @SerializedName("keterangan")
    val keterangan: String?
)

// Response wrapper untuk list kelas kosong
data class KelasKosongListResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: List<KelasKosongData>
)
