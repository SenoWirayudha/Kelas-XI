package com.komputerkit.aplikasimonitoringkelas.api.models

import com.google.gson.annotations.SerializedName

// Model untuk Kelas
data class KelasData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("nama_kelas")
    val nama_kelas: String,
    
    @SerializedName("created_at")
    val created_at: String? = null,
    
    @SerializedName("updated_at")
    val updated_at: String? = null
)

// Response untuk list kelas
data class KelasListResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String? = null,
    
    @SerializedName("data")
    val data: List<KelasData>
)

// Model untuk Jadwal
data class JadwalData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("guru_id")
    val guru_id: Int,
    
    @SerializedName("mapel_id")
    val mapel_id: Int,
    
    @SerializedName("tahun_ajaran_id")
    val tahun_ajaran_id: Int,
    
    @SerializedName("kelas_id")
    val kelas_id: Int,
    
    @SerializedName("jam_ke")
    val jam_ke: String,
    
    @SerializedName("hari")
    val hari: String,
    
    @SerializedName("guru")
    val guru: JadwalGuruData? = null,
    
    @SerializedName("mapel")
    val mapel: JadwalMapelData? = null,
    
    @SerializedName("kelas")
    val kelas: KelasData? = null,
    
    @SerializedName("tahun_ajaran")
    val tahun_ajaran: TahunAjaranData? = null,
    
    @SerializedName("created_at")
    val created_at: String? = null,
    
    @SerializedName("updated_at")
    val updated_at: String? = null
)

// Model untuk Guru dalam relasi jadwal (renamed to avoid conflict)
data class JadwalGuruData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("kode_guru")
    val kode_guru: String,
    
    @SerializedName("nama_guru")
    val nama_guru: String,
    
    @SerializedName("telepon")
    val telepon: String? = null
)

// Model untuk Mapel dalam relasi jadwal (renamed to avoid conflict)
data class JadwalMapelData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("kode_mapel")
    val kode_mapel: String,
    
    @SerializedName("nama_mapel")
    val nama_mapel: String
)

// Model untuk Tahun Ajaran dalam relasi
data class TahunAjaranData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("tahun")
    val tahun: String,
    
    @SerializedName("flag")
    val flag: Boolean? = null  // Changed from Int to Boolean to match API response
)

// Request untuk create jadwal
data class CreateJadwalRequest(
    @SerializedName("guru_id")
    val guru_id: Int,
    
    @SerializedName("mapel_id")
    val mapel_id: Int,
    
    @SerializedName("tahun_ajaran_id")
    val tahun_ajaran_id: Int,
    
    @SerializedName("kelas_id")
    val kelas_id: Int,
    
    @SerializedName("jam_ke")
    val jam_ke: String,
    
    @SerializedName("hari")
    val hari: String
)

// Response untuk list jadwal
data class JadwalListResponse(
    val success: Boolean,
    val message: String? = null,
    val data: List<JadwalData>
)

// Response untuk single jadwal
data class JadwalResponse(
    val success: Boolean,
    val message: String,
    val data: JadwalData
)
