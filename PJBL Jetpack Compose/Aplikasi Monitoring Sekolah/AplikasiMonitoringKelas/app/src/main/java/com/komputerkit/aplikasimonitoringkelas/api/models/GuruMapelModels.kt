package com.komputerkit.aplikasimonitoringkelas.api.models

import com.google.gson.annotations.SerializedName

// ==================== GURU MODELS ====================

data class GuruData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("kode_guru")
    val kodeGuru: String,
    
    @SerializedName("nama_guru")
    val namaGuru: String,
    
    @SerializedName("telepon")
    val telepon: String? = null,
    
    @SerializedName("created_at")
    val createdAt: String? = null,
    
    @SerializedName("updated_at")
    val updatedAt: String? = null
)

data class GuruListResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: List<GuruData>
)

data class GuruResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: GuruData
)

// ==================== MAPEL MODELS ====================

data class MapelData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("kode_mapel")
    val kodeMapel: String,
    
    @SerializedName("nama_mapel")
    val namaMapel: String,
    
    @SerializedName("created_at")
    val createdAt: String? = null,
    
    @SerializedName("updated_at")
    val updatedAt: String? = null
)

data class MapelListResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: List<MapelData>
)

data class MapelResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: MapelData
)

// ==================== JADWAL DETAIL FOR CASCADE FILTER ====================

data class JadwalDetailData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("jadwal_id")
    val jadwalId: Int,
    
    @SerializedName("hari")
    val hari: String,
    
    @SerializedName("jam_ke")
    val jamKe: String,
    
    @SerializedName("kelas_id")
    val kelasId: Int,
    
    @SerializedName("kelas")
    val kelas: String,
    
    @SerializedName("guru_id")
    val guruId: Int,
    
    @SerializedName("guru")
    val guru: String,
    
    @SerializedName("mapel_id")
    val mapelId: Int,
    
    @SerializedName("mapel")
    val mapel: String,
    
    @SerializedName("tahun_ajaran_id")
    val tahunAjaranId: Int,
    
    @SerializedName("tahun_ajaran")
    val tahunAjaran: String
)

data class JadwalDetailResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("data")
    val data: JadwalDetailData
)

// ==================== GURU MENGAJAR CREATE REQUEST ====================

data class CreateGuruMengajarRequest(
    @SerializedName("jadwal_id")
    val jadwalId: Int,
    
    @SerializedName("status")
    val status: String,
    
    @SerializedName("keterangan")
    val keterangan: String?
)
