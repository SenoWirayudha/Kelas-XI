package com.komputerkit.firebasetutorial.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.komputerkit.firebasetutorial.R

class MyFirebaseMessagingService: FirebaseMessagingService() {

    companion object {
        const val CHANNEL_ID = "dummy_channel"
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        if (message.notification != null) {
            Log.d("FCM__PESAN", "Title: ${message.notification?.title}")
            Log.d("FCM__PESAN", "Body: ${message.notification?.body}")
            startNotification(
                message.notification?.title ?: "Hai ! Ada kabar gembira 🚀",
                message.notification?.body ?: "Kamu dapat promo nih, segera tukarkan promo di outlet terdekat ya"
            )
        }
    }

    private fun startNotification(title: String, body: String) {
        createNotificationChannel()

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Menggunakan icon default Android
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        val notificationManager =
            applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(1, builder.build())
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Important Notification Channel",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "This notification contains important announcement, etc."
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}