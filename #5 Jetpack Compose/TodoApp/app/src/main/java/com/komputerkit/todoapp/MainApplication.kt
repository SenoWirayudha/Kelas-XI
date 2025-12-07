package com.komputerkit.todoapp

import android.app.Application
import com.komputerkit.todoapp.data.database.TodoDatabase

class MainApplication : Application() {
    
    val database by lazy { TodoDatabase.getDatabase(this) }
}