package com.komputerkit.moview.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    
    // GANTI IP INI dengan IP komputer Anda yang menjalankan Laravel
    // Jangan gunakan localhost atau 127.0.0.1 karena itu merujuk ke emulator
    // Gunakan: ipconfig (Windows) atau ifconfig (Mac/Linux) untuk cek IP Anda
    private const val BASE_URL = "http://10.0.2.2:8000/api/v1/"  // Untuk emulator
    // Atau gunakan IP lokal Anda, contoh: "http://192.168.1.100:8000/api/v1/"
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val movieApiService: MovieApiService = retrofit.create(MovieApiService::class.java)
}
