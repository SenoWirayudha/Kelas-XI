package com.komputerkit.aplikasimonitoringkelas.api

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    
    private var retrofit: Retrofit? = null
    
    private fun getRetrofit(): Retrofit {
        if (retrofit == null) {
            // Logging Interceptor untuk debugging
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            
            // Interceptor untuk menambahkan header Connection: close
            // Ini memaksa server untuk tidak reuse connection
            val connectionInterceptor = Interceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("Connection", "close")
                    .build()
                chain.proceed(request)
            }
            
            // OkHttp Client configuration - FIXED FOR "UNEXPECTED END OF STREAM"
            val client = OkHttpClient.Builder()
                .addInterceptor(connectionInterceptor)  // Add first!
                .addInterceptor(loggingInterceptor)
                .connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .callTimeout(60, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                // Disable connection pool to prevent reuse issues
                .connectionPool(okhttp3.ConnectionPool(0, 1, TimeUnit.NANOSECONDS))
                // Additional settings
                .followRedirects(true)
                .followSslRedirects(true)
                .build()
            
            // Retrofit instance
            retrofit = Retrofit.Builder()
                .baseUrl(ApiConfig.BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
        return retrofit!!
    }
    
    fun getApiService(): ApiService {
        return getRetrofit().create(ApiService::class.java)
    }
}
