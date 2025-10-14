package com.komputerkit.wavesoffood

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp

class WavesOfFoodApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        try {
            // Initialize Firebase
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this)
                Log.d("Firebase", "Firebase initialized successfully")
            } else {
                Log.d("Firebase", "Firebase already initialized")
            }
        } catch (e: Exception) {
            Log.e("Firebase", "Failed to initialize Firebase: ${e.message}")
        }
    }
}
