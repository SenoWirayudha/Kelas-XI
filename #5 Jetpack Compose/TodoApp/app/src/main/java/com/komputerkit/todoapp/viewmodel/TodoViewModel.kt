package com.komputerkit.todoapp.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.komputerkit.todoapp.data.dao.TodoDao
import com.komputerkit.todoapp.data.entity.Todo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Date

class TodoViewModel(private val todoDao: TodoDao) : ViewModel() {
    
    val allTodos: LiveData<List<Todo>> = todoDao.getAllTodos()
    
    fun addTodo(title: String) {
        if (title.isNotBlank()) {
            viewModelScope.launch(Dispatchers.IO) {
                todoDao.insertTodo(
                    Todo(
                        title = title.trim(),
                        createdAt = Date()
                    )
                )
            }
        }
    }
    
    fun deleteTodo(todo: Todo) {
        viewModelScope.launch(Dispatchers.IO) {
            todoDao.deleteTodo(todo)
        }
    }
    
    fun deleteTodoById(id: Long) {
        viewModelScope.launch(Dispatchers.IO) {
            todoDao.deleteTodoById(id)
        }
    }
}

class TodoViewModelFactory(private val todoDao: TodoDao) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TodoViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return TodoViewModel(todoDao) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}