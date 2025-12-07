package com.komputerkit.earningapp.screens

import android.content.Context
import android.os.Bundle
import android.os.CountDownTimer
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.komputerkit.earningapp.R
import com.komputerkit.earningapp.data.database.AppDatabase
import com.komputerkit.earningapp.data.entity.QuizQuestion
import com.komputerkit.earningapp.data.entity.QuizResult
import com.komputerkit.earningapp.data.entity.Transaction
import com.komputerkit.earningapp.data.repository.QuizRepository
import com.komputerkit.earningapp.data.repository.TransactionRepository
import com.komputerkit.earningapp.data.repository.UserRepository
import kotlinx.coroutines.launch

class QuizActivity : AppCompatActivity() {
    
    private lateinit var categoryNameTextView: TextView
    private lateinit var questionNumberTextView: TextView
    private lateinit var questionTextView: TextView
    private lateinit var timerTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var option1Button: Button
    private lateinit var option2Button: Button
    private lateinit var option3Button: Button
    private lateinit var option4Button: Button
    
    private var userId: Int = 0
    private var categoryId: Int = 0
    private var categoryName: String = ""
    
    private lateinit var userRepository: UserRepository
    private lateinit var quizRepository: QuizRepository
    private lateinit var transactionRepository: TransactionRepository
    
    private var questions: List<QuizQuestion> = emptyList()
    private var currentQuestionIndex = 0
    private var correctAnswers = 0
    private var totalCoinsEarned = 0
    
    private var timer: CountDownTimer? = null
    private val QUESTION_TIME_LIMIT = 30000L // 30 seconds per question
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_quiz)
        
        // Get data from intent
        categoryId = intent.getIntExtra("categoryId", 0)
        categoryName = intent.getStringExtra("categoryName") ?: "Quiz"
        
        // Setup action bar
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = categoryName
        
        // Get userId
        val sharedPref = getSharedPreferences("EarningQuizApp", Context.MODE_PRIVATE)
        userId = sharedPref.getInt("userId", 0)
        
        // Initialize database
        val database = AppDatabase.getDatabase(this)
        userRepository = UserRepository(database.userDao())
        quizRepository = QuizRepository(
            database.quizCategoryDao(),
            database.quizQuestionDao(),
            database.quizResultDao()
        )
        transactionRepository = TransactionRepository(database.transactionDao())
        
        // Initialize views
        categoryNameTextView = findViewById(R.id.categoryNameTextView)
        questionNumberTextView = findViewById(R.id.questionNumberTextView)
        questionTextView = findViewById(R.id.questionTextView)
        timerTextView = findViewById(R.id.timerTextView)
        progressBar = findViewById(R.id.quizProgressBar)
        option1Button = findViewById(R.id.option1Button)
        option2Button = findViewById(R.id.option2Button)
        option3Button = findViewById(R.id.option3Button)
        option4Button = findViewById(R.id.option4Button)
        
        categoryNameTextView.text = categoryName
        
        // Setup option buttons
        option1Button.setOnClickListener { checkAnswer("A") }
        option2Button.setOnClickListener { checkAnswer("B") }
        option3Button.setOnClickListener { checkAnswer("C") }
        option4Button.setOnClickListener { checkAnswer("D") }
        
        // Load questions
        loadQuestions()
    }
    
    private fun loadQuestions() {
        lifecycleScope.launch {
            try {
                // Get 10 random questions from this category
                questions = quizRepository.getQuestionsByCategory(categoryId, 10)
                
                android.util.Log.d("QuizActivity", "CategoryId: $categoryId, Questions loaded: ${questions.size}")
                
                if (questions.isEmpty()) {
                    // No questions available
                    runOnUiThread {
                        Toast.makeText(
                            this@QuizActivity,
                            "Belum ada soal untuk kategori ini (ID: $categoryId)",
                            Toast.LENGTH_LONG
                        ).show()
                        finish()
                    }
                } else {
                    runOnUiThread {
                        progressBar.max = questions.size
                        showQuestion()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                android.util.Log.e("QuizActivity", "Error loading questions: ${e.message}", e)
                runOnUiThread {
                    Toast.makeText(
                        this@QuizActivity,
                        "Error loading questions: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                    finish()
                }
            }
        }
    }
    
    private fun showQuestion() {
        if (currentQuestionIndex >= questions.size) {
            showResult()
            return
        }
        
        val question = questions[currentQuestionIndex]
        
        // Update UI
        questionNumberTextView.text = "Pertanyaan ${currentQuestionIndex + 1}/${questions.size}"
        questionTextView.text = question.question
        progressBar.progress = currentQuestionIndex + 1
        
        // Set options
        option1Button.text = question.optionA
        option1Button.tag = "A"
        option2Button.text = question.optionB
        option2Button.tag = "B"
        option3Button.text = question.optionC
        option3Button.tag = "C"
        option4Button.text = question.optionD
        option4Button.tag = "D"
        
        // Enable all buttons
        enableAllButtons(true)
        
        // Start timer
        startTimer()
    }
    
    private fun startTimer() {
        timer?.cancel()
        
        timer = object : CountDownTimer(QUESTION_TIME_LIMIT, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val seconds = millisUntilFinished / 1000
                timerTextView.text = "⏱️ ${seconds}s"
            }
            
            override fun onFinish() {
                timerTextView.text = "⏱️ 0s"
                Toast.makeText(this@QuizActivity, "Waktu habis!", Toast.LENGTH_SHORT).show()
                nextQuestion()
            }
        }.start()
    }
    
    private fun checkAnswer(selectedAnswer: String) {
        timer?.cancel()
        
        val question = questions[currentQuestionIndex]
        val isCorrect = selectedAnswer == question.correctAnswer
        
        // Get the correct answer text
        val correctAnswerText = when(question.correctAnswer) {
            "A" -> question.optionA
            "B" -> question.optionB
            "C" -> question.optionC
            "D" -> question.optionD
            else -> question.optionA
        }
        
        if (isCorrect) {
            correctAnswers++
            totalCoinsEarned += question.points
            Toast.makeText(this, "✅ Benar! +${question.points} koin", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "❌ Salah! Jawaban: $correctAnswerText", Toast.LENGTH_SHORT).show()
        }
        
        // Disable buttons
        enableAllButtons(false)
        
        // Move to next question after a short delay
        timerTextView.postDelayed({
            nextQuestion()
        }, 1500)
    }
    
    private fun nextQuestion() {
        currentQuestionIndex++
        if (currentQuestionIndex < questions.size) {
            showQuestion()
        } else {
            showResult()
        }
    }
    
    private fun showResult() {
        timer?.cancel()
        
        // Save quiz result
        lifecycleScope.launch {
            try {
                // Save result to database
                quizRepository.insertResult(
                    QuizResult(
                        userId = userId,
                        categoryId = categoryId,
                        totalQuestions = questions.size,
                        correctAnswers = correctAnswers,
                        wrongAnswers = questions.size - correctAnswers,
                        coinsEarned = totalCoinsEarned
                    )
                )
                
                // Update user coins
                val user = userRepository.getUserById(userId)
                user?.let {
                    val newCoins = it.coins + totalCoinsEarned
                    userRepository.updateCoins(userId, newCoins)
                    
                    // Log transaction
                    transactionRepository.insertTransaction(
                        Transaction(
                            userId = userId,
                            type = "QUIZ",
                            amount = totalCoinsEarned,
                            description = "Quiz $categoryName: $correctAnswers/${questions.size} correct"
                        )
                    )
                }
                
                // Show result dialog
                runOnUiThread {
                    showResultDialog()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                runOnUiThread {
                    Toast.makeText(
                        this@QuizActivity,
                        "Error saving result: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun showResultDialog() {
        val percentage = (correctAnswers.toFloat() / questions.size * 100).toInt()
        
        val message = buildString {
            append("Kategori: $categoryName\n\n")
            append("Benar: $correctAnswers/${questions.size}\n")
            append("Persentase: $percentage%\n")
            append("Koin Diperoleh: $totalCoinsEarned 🪙\n\n")
            
            when {
                percentage >= 80 -> append("🏆 Luar biasa!")
                percentage >= 60 -> append("👍 Bagus!")
                percentage >= 40 -> append("💪 Coba lagi!")
                else -> append("📚 Terus belajar!")
            }
        }
        
        AlertDialog.Builder(this)
            .setTitle("Quiz Selesai! 🎉")
            .setMessage(message)
            .setPositiveButton("Kembali ke Home") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }
    
    private fun enableAllButtons(enabled: Boolean) {
        option1Button.isEnabled = enabled
        option2Button.isEnabled = enabled
        option3Button.isEnabled = enabled
        option4Button.isEnabled = enabled
    }
    
    override fun onDestroy() {
        super.onDestroy()
        timer?.cancel()
    }
    
    override fun onSupportNavigateUp(): Boolean {
        // Show confirmation dialog before leaving
        AlertDialog.Builder(this)
            .setTitle("Keluar dari Quiz?")
            .setMessage("Progress Anda akan hilang")
            .setPositiveButton("Ya") { _, _ ->
                finish()
            }
            .setNegativeButton("Tidak", null)
            .show()
        return true
    }
}
