package com.komputerkit.moview

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.module.AppGlideModule
import com.bumptech.glide.request.RequestOptions
import okhttp3.OkHttpClient
import java.io.InputStream
import java.util.concurrent.TimeUnit

@GlideModule
class MovieGlideModule : AppGlideModule() {

    override fun applyOptions(context: Context, builder: GlideBuilder) {
        // Set default request options for faster loading
        builder.setDefaultRequestOptions(
            RequestOptions()
                .format(DecodeFormat.PREFER_RGB_565) // Use less memory
                .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache everything
                .timeout(15000) // 15 second timeout
        )
    }

    override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
        // Use OkHttp with longer timeout and retry logic for profile photos
        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)  // Increased from 10s
            .readTimeout(30, TimeUnit.SECONDS)     // Increased from 15s
            .writeTimeout(30, TimeUnit.SECONDS)    // Increased from 15s
            .retryOnConnectionFailure(true)        // Auto retry on connection failure
            .addInterceptor { chain ->
                val request = chain.request()
                var response = chain.proceed(request)
                
                // Retry up to 3 times if we get unexpected end of stream
                var tryCount = 0
                while (!response.isSuccessful && tryCount < 3) {
                    tryCount++
                    response.close()
                    response = chain.proceed(request)
                }
                
                response
            }
            .build()

        registry.replace(
            GlideUrl::class.java,
            InputStream::class.java,
            OkHttpUrlLoader.Factory(client)
        )
    }

    override fun isManifestParsingEnabled(): Boolean {
        return false // Disable manifest parsing for faster app startup
    }
}
