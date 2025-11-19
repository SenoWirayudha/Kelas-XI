package com.komputerkit.earningapp.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.komputerkit.earningapp.data.dao.*
import com.komputerkit.earningapp.data.entity.*

@Database(
    entities = [
        User::class, 
        Transaction::class, 
        Withdrawal::class,
        QuizCategory::class,
        QuizQuestion::class,
        QuizResult::class
    ],
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    
    abstract fun userDao(): UserDao
    abstract fun transactionDao(): TransactionDao
    abstract fun withdrawalDao(): WithdrawalDao
    abstract fun quizCategoryDao(): QuizCategoryDao
    abstract fun quizQuestionDao(): QuizQuestionDao
    abstract fun quizResultDao(): QuizResultDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "earning_quiz_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
