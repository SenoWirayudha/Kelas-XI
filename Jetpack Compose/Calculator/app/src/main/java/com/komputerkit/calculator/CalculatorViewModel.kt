package com.komputerkit.calculator

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class CalculatorViewModel : ViewModel() {
    
    private val _equationText = MutableStateFlow("")
    val equationText: StateFlow<String> = _equationText.asStateFlow()
    
    private val _resultText = MutableStateFlow("0")
    val resultText: StateFlow<String> = _resultText.asStateFlow()
    
    /**
     * Menangani logika untuk setiap tombol yang diklik
     */
    fun onButtonClick(button: String) {
        when (button) {
            "AC" -> {
                // Logika 'AC': Mengosongkan equationText dan mengatur resultText ke "0"
                _equationText.value = ""
                _resultText.value = "0"
            }
            "C" -> {
                // Logika 'C' (Hapus): Menghapus karakter terakhir dari equationText
                if (_equationText.value.isNotEmpty()) {
                    _equationText.value = _equationText.value.dropLast(1)
                    if (_equationText.value.isEmpty()) {
                        _resultText.value = "0"
                    } else {
                        calculateResult()
                    }
                }
            }
            "=" -> {
                // Logika '=': Mengatur equationText sama dengan resultText
                _equationText.value = _resultText.value
                calculateResult()
            }
            else -> {
                // Menambahkan karakter/operator dengan validasi
                val newEquation = addButtonWithValidation(button)
                _equationText.value = newEquation
                calculateResult()
            }
        }
    }
    
    /**
     * Menambahkan tombol dengan validasi untuk mencegah operator bertumpuk
     */
    private fun addButtonWithValidation(button: String): String {
        val currentEquation = _equationText.value
        val operators = listOf("+", "-", "*", "/")
        val isOperator = button in operators
        
        // Jika equation kosong dan tombol adalah operator (kecuali minus untuk bilangan negatif)
        if (currentEquation.isEmpty() && isOperator && button != "-") {
            return currentEquation // Tidak menambahkan operator di awal
        }
        
        // Jika tombol adalah operator
        if (isOperator) {
            // Cek karakter terakhir
            if (currentEquation.isNotEmpty()) {
                val lastChar = currentEquation.last().toString()
                
                // Jika karakter terakhir juga operator, ganti dengan operator baru
                if (lastChar in operators) {
                    return currentEquation.dropLast(1) + button
                }
                
                // Jika karakter terakhir adalah kurung buka, hanya izinkan minus untuk bilangan negatif  
                if (lastChar == "(" && button != "-") {
                    return currentEquation
                }
                
                // Jika karakter terakhir adalah titik, tidak boleh langsung operator
                if (lastChar == ".") {
                    return currentEquation
                }
            }
        }
        
        // Validasi untuk titik desimal
        if (button == ".") {
            // Cek apakah sudah ada titik dalam bilangan saat ini
            val lastNumberPart = getLastNumberPart(currentEquation)
            if (lastNumberPart.contains(".")) {
                return currentEquation // Tidak menambahkan titik jika sudah ada
            }
        }
        
        // Validasi untuk kurung
        if (button == "(") {
            // Kurung buka hanya boleh setelah operator atau di awal atau setelah kurung buka lain
            if (currentEquation.isNotEmpty()) {
                val lastChar = currentEquation.last().toString()
                if (lastChar !in operators && lastChar != "(") {
                    return currentEquation + "*" + button // Auto multiply
                }
            }
        }
        
        if (button == ")") {
            // Kurung tutup hanya boleh jika ada kurung buka yang belum tertutup
            // dan karakter terakhir bukan operator
            val openCount = currentEquation.count { it == '(' }
            val closeCount = currentEquation.count { it == ')' }
            
            if (openCount <= closeCount || currentEquation.isEmpty()) {
                return currentEquation // Tidak menambahkan kurung tutup
            }
            
            val lastChar = currentEquation.last().toString()
            if (lastChar in operators || lastChar == "(") {
                return currentEquation // Tidak menambahkan kurung tutup setelah operator
            }
        }
        
        // Validasi untuk angka
        if (button.all { it.isDigit() }) {
            // Jika karakter terakhir adalah kurung tutup, tambahkan perkalian otomatis
            if (currentEquation.isNotEmpty() && currentEquation.last() == ')') {
                return currentEquation + "*" + button
            }
        }
        
        return currentEquation + button
    }
    
    /**
     * Mendapatkan bagian angka terakhir dari equation untuk validasi titik desimal
     */
    private fun getLastNumberPart(equation: String): String {
        val operators = listOf("+", "-", "*", "/", "(", ")")
        var i = equation.length - 1
        
        while (i >= 0 && equation[i].toString() !in operators) {
            i--
        }
        
        return equation.substring(i + 1)
    }
    
    /**
     * Memanggil evaluateExpression(equationText.value) dan memperbarui resultText
     */
    private fun calculateResult() {
        if (_equationText.value.isEmpty()) {
            _resultText.value = "0"
            return
        }
        
        try {
            val result = evaluateExpression(_equationText.value)
            _resultText.value = if (result == result.toInt().toDouble()) {
                result.toInt().toString()
            } else {
                result.toString()
            }
        } catch (e: Exception) {
            // Jika terjadi error dalam perhitungan, tetap tampilkan hasil sebelumnya
            // atau tampilkan "Error" jika diperlukan
            // _resultText.value = "Error"
        }
    }
    
    /**
     * Fungsi evaluasi ekspresi matematika
     * Implementasi sederhana menggunakan ScriptEngine atau library evaluasi
     */
    private fun evaluateExpression(equation: String): Double {
        try {
            // Implementasi sederhana untuk evaluasi ekspresi matematika
            // Dalam implementasi nyata, Anda bisa menggunakan library seperti:
            // - Rhino JavaScript Engine
            // - EvalEx library
            // - Atau implementasi parser sendiri
            
            // Untuk demo, kita gunakan implementasi sederhana dengan eval-like function
            return evaluateBasicExpression(equation)
        } catch (e: Exception) {
            throw e
        }
    }
    
    /**
     * Implementasi evaluasi ekspresi matematika dengan dukungan tanda kurung
     * Menggunakan recursive descent parser yang benar
     */
    private fun evaluateBasicExpression(expression: String): Double {
        val expr = expression.replace(" ", "")
        if (expr.isEmpty()) return 0.0
        
        return ExpressionParser(expr).parseExpression()
    }
    
    /**
     * Parser ekspresi matematika yang mendukung tanda kurung
     */
    private inner class ExpressionParser(private val expression: String) {
        private var position = 0
        
        fun parseExpression(): Double {
            val result = parseAdditionSubtraction()
            if (position < expression.length) {
                throw IllegalArgumentException("Unexpected character at position $position")
            }
            return result
        }
        
        private fun parseAdditionSubtraction(): Double {
            var result = parseMultiplicationDivision()
            
            while (position < expression.length) {
                when (expression[position]) {
                    '+' -> {
                        position++
                        result += parseMultiplicationDivision()
                    }
                    '-' -> {
                        position++
                        result -= parseMultiplicationDivision()
                    }
                    else -> break
                }
            }
            return result
        }
        
        private fun parseMultiplicationDivision(): Double {
            var result = parseFactor()
            
            while (position < expression.length) {
                when (expression[position]) {
                    '*' -> {
                        position++
                        result *= parseFactor()
                    }
                    '/' -> {
                        position++
                        val divisor = parseFactor()
                        if (divisor == 0.0) throw ArithmeticException("Division by zero")
                        result /= divisor
                    }
                    else -> break
                }
            }
            return result
        }
        
        private fun parseFactor(): Double {
            // Handle unary minus
            if (position < expression.length && expression[position] == '-') {
                position++
                return -parseFactor()
            }
            
            // Handle unary plus  
            if (position < expression.length && expression[position] == '+') {
                position++
                return parseFactor()
            }
            
            // Handle parentheses
            if (position < expression.length && expression[position] == '(') {
                position++ // Skip '('
                val result = parseAdditionSubtraction()
                if (position < expression.length && expression[position] == ')') {
                    position++ // Skip ')'
                    return result
                } else {
                    throw IllegalArgumentException("Missing closing parenthesis")
                }
            }
            
            // Parse number
            return parseNumber()
        }
        
        private fun parseNumber(): Double {
            val start = position
            
            // Handle digits and decimal point
            while (position < expression.length && 
                   (expression[position].isDigit() || expression[position] == '.')) {
                position++
            }
            
            if (start == position) {
                throw IllegalArgumentException("Expected number at position $position")
            }
            
            return expression.substring(start, position).toDouble()
        }
    }
}