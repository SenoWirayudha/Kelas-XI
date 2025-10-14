package com.komputerkit.stateexample

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class StateTestViewModel : ViewModel() {
    
    // Private MutableLiveData for internal state management
    private val _name = MutableLiveData<String>("")
    private val _surname = MutableLiveData<String>("")
    
    // Public LiveData for external observation
    val name: LiveData<String> = _name
    val surname: LiveData<String> = _surname
    
    // Functions to update name and surname
    fun onNameUpdate(newName: String) {
        _name.value = newName
    }
    
    fun onSurnameUpdate(newSurname: String) {
        _surname.value = newSurname
    }
}