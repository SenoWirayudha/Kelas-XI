package com.komputerkit.todoapp.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.komputerkit.todoapp.data.converter.DateConverter
import com.komputerkit.todoapp.data.dao.TodoDao
import com.komputerkit.todoapp.data.entity.Todo

@Database(
    entities = [Todo::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(DateConverter::class)
abstract class TodoDatabase : RoomDatabase() {
    
    abstract fun todoDao(): TodoDao
    
    companion object {
        @Volatile
        private var INSTANCE: TodoDatabase? = null
        
        fun getDatabase(context: Context): TodoDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    TodoDatabase::class.java,
                    "todo_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}