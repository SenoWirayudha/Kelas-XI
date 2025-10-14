package com.komputerkit.wavesoffood.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.komputerkit.wavesoffood.model.Food
import com.komputerkit.wavesoffood.repository.FoodRepository
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class FoodViewModel(private val repository: FoodRepository) : ViewModel() {
    private val _foods = MutableLiveData<List<Food>>()
    val foods: LiveData<List<Food>> = _foods

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    init {
        loadFoods()
    }

    fun loadFoods(category: String? = null) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            repository.getFoods(category)
                .catch { e ->
                    _error.value = e.message
                    _isLoading.value = false
                }
                .collect { foodList ->
                    _foods.value = foodList
                    _isLoading.value = false
                }
        }
    }

    fun getFoodById(foodId: String): LiveData<Food?> {
        val result = MutableLiveData<Food?>()
        viewModelScope.launch {
            repository.getFoodById(foodId)
                .catch { e ->
                    _error.value = e.message
                }
                .collect { food ->
                    result.value = food
                }
        }
        return result
    }
}
