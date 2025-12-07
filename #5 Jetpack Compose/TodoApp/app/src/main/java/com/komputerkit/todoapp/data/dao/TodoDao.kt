package com.komputerkit.todoapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import com.komputerkit.todoapp.data.entity.Todo

@Dao
interface TodoDao {
    
    @Query("SELECT * FROM todos ORDER BY createdAt DESC")
    fun getAllTodos(): LiveData<List<Todo>>
    
    @Insert
    suspend fun insertTodo(todo: Todo)
    
    @Delete
    suspend fun deleteTodo(todo: Todo)
    
    @Query("DELETE FROM todos WHERE id = :id")
    suspend fun deleteTodoById(id: Long)
}