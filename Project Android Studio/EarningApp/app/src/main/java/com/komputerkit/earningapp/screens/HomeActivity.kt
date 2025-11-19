package com.komputerkit.earningapp.screens

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.komputerkit.earningapp.R
import com.komputerkit.earningapp.data.database.AppDatabase
import com.komputerkit.earningapp.data.entity.QuizCategory
import com.komputerkit.earningapp.data.helper.QuizSeeder
import com.komputerkit.earningapp.data.repository.QuizRepository
import com.komputerkit.earningapp.data.repository.UserRepository
import com.komputerkit.earningapp.widgets.CategoryAdapter
import kotlinx.coroutines.launch

class HomeActivity : AppCompatActivity() {
    
    private lateinit var userNameTextView: TextView
    private lateinit var coinsTextView: TextView
    private lateinit var categoriesRecyclerView: RecyclerView
    private lateinit var bottomNavigation: BottomNavigationView
    
    private var userId: Int = 0
    private lateinit var database: AppDatabase
    private lateinit var userRepository: UserRepository
    private lateinit var quizRepository: QuizRepository
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)
        
        // Get userId from session
        val sharedPref = getSharedPreferences("EarningQuizApp", Context.MODE_PRIVATE)
        userId = sharedPref.getInt("userId", 0)
        
        // Initialize database
        database = AppDatabase.getDatabase(this)
        userRepository = UserRepository(database.userDao())
        quizRepository = QuizRepository(
            database.quizCategoryDao(),
            database.quizQuestionDao(),
            database.quizResultDao()
        )
        
        // Initialize views
        userNameTextView = findViewById(R.id.userNameTextView)
        coinsTextView = findViewById(R.id.coinsTextView)
        categoriesRecyclerView = findViewById(R.id.categoriesRecyclerView)
        bottomNavigation = findViewById(R.id.bottomNavigation)
        
        // Load user data
        loadUserData()
        
        // Initialize categories in database
        initializeCategories()
        
        // Setup categories
        setupCategories()
        
        // Setup bottom navigation
        setupBottomNavigation()
    }
    
    private fun loadUserData() {
        if (userId == 0) {
            // Fallback to SharedPreferences
            val sharedPref = getSharedPreferences("EarningQuizApp", Context.MODE_PRIVATE)
            val userName = sharedPref.getString("userName", "User") ?: "User"
            userNameTextView.text = "Halo, $userName!"
            coinsTextView.text = "0"
            return
        }
        
        // Load from Room Database with LiveData
        userRepository.getUserByIdLiveData(userId).observe(this) { user ->
            user?.let {
                userNameTextView.text = "Halo, ${it.username}!"
                coinsTextView.text = it.coins.toString()
            }
        }
    }
    
    private fun initializeCategories() {
        lifecycleScope.launch {
            try {
                // Check if categories already exist
                val count = quizRepository.getCategoriesCount()
                android.util.Log.d("HomeActivity", "Categories count: $count")
                
                if (count == 0) {
                    // Insert default categories with explicit IDs
                    val categories = listOf(
                        QuizCategory(id = 1, name = "Sains", icon = "🔬", color = "#4CAF50", description = "Pertanyaan seputar sains dan ilmu pengetahuan"),
                        QuizCategory(id = 2, name = "Sejarah", icon = "📜", color = "#FF9800", description = "Fakta sejarah dunia dan Indonesia"),
                        QuizCategory(id = 3, name = "Teknologi", icon = "💻", color = "#2196F3", description = "Tech, gadget, dan programming"),
                        QuizCategory(id = 4, name = "Matematika", icon = "🔢", color = "#9C27B0", description = "Soal matematika dan logika"),
                        QuizCategory(id = 5, name = "Bahasa", icon = "📚", color = "#F44336", description = "Bahasa Indonesia dan Inggris"),
                        QuizCategory(id = 6, name = "Geografi", icon = "🌍", color = "#00BCD4", description = "Tempat, negara, dan budaya"),
                        QuizCategory(id = 7, name = "Olahraga", icon = "⚽", color = "#FF5722", description = "Sport facts dan trivia"),
                        QuizCategory(id = 8, name = "Seni", icon = "🎨", color = "#E91E63", description = "Seni, musik, dan budaya")
                    )
                    quizRepository.insertCategories(categories)
                    android.util.Log.d("HomeActivity", "Categories inserted: ${categories.size}")
                    
                    // Insert quiz questions
                    val questions = QuizSeeder.getAllQuestions()
                    quizRepository.insertQuestions(questions)
                    android.util.Log.d("HomeActivity", "Questions inserted: ${questions.size}")
                    
                    // Log questions per category
                    questions.groupBy { it.categoryId }.forEach { (catId, catQuestions) ->
                        android.util.Log.d("HomeActivity", "Category $catId: ${catQuestions.size} questions")
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                android.util.Log.e("HomeActivity", "Error initializing categories: ${e.message}", e)
            }
        }
    }
    
    private fun setupCategories() {
        // Observe categories from database
        quizRepository.getAllCategories().observe(this) { dbCategories ->
            if (dbCategories.isNotEmpty()) {
                // Convert to Category data class for adapter with ID mapping
                val categoryMap = dbCategories.associateBy { it.name }
                val categories = dbCategories.map { dbCat ->
                    Category(dbCat.name, dbCat.icon, dbCat.color)
                }
                
                val adapter = CategoryAdapter(categories) { category ->
                    // Find the category in database to get its ID
                    val dbCategory = categoryMap[category.name]
                    dbCategory?.let {
                        // Navigate to QuizActivity with category data
                        val intent = Intent(this, QuizActivity::class.java)
                        intent.putExtra("categoryId", it.id)
                        intent.putExtra("categoryName", it.name)
                        startActivity(intent)
                    }
                }
                
                categoriesRecyclerView.layoutManager = GridLayoutManager(this, 2)
                categoriesRecyclerView.adapter = adapter
            }
        }
    }
    
    private fun setupBottomNavigation() {
        bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    // Already on home
                    true
                }
                R.id.nav_spin -> {
                    startActivity(Intent(this, SpinActivity::class.java))
                    true
                }
                R.id.nav_withdrawal -> {
                    startActivity(Intent(this, WithdrawalActivity::class.java))
                    true
                }
                else -> false
            }
        }
    }
}

// Data class for Category
data class Category(
    val name: String,
    val icon: String,
    val color: String
)
