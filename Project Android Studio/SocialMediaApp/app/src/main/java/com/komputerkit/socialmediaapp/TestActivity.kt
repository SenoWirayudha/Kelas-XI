package com.komputerkit.socialmediaapp

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.komputerkit.socialmediaapp.adapter.PostAdapter
import com.komputerkit.socialmediaapp.databinding.ActivityTestBinding
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import com.komputerkit.socialmediaapp.viewmodel.UserViewModel

class TestActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityTestBinding
    private lateinit var postAdapter: PostAdapter
    private lateinit var userViewModel: UserViewModel
    private lateinit var firebaseRepository: FirebaseRepository
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTestBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        Log.d("TestActivity", "Test Activity started")
        
        userViewModel = ViewModelProvider(this)[UserViewModel::class.java]
        
        setupRecyclerView()
        loadPosts()
    }
    
    private fun setupRecyclerView() {
        postAdapter = PostAdapter(
            posts = emptyList(),
            onLikeClick = { post -> Log.d("TestActivity", "Like clicked: ${post.id}") },
            onCommentClick = { post -> Log.d("TestActivity", "Comment clicked: ${post.id}") },
            onShareClick = { post -> Log.d("TestActivity", "Share clicked: ${post.id}") },
            onSaveClick = { post -> Log.d("TestActivity", "Save clicked: ${post.id}") },
            onProfileClick = { userId -> Log.d("TestActivity", "Profile clicked: $userId") },
            onDeleteClick = { post -> Log.d("TestActivity", "Delete clicked: ${post.id}") },
            getUserForPost = { userId -> userViewModel.getUserById(userId) },
            lifecycleOwner = this,
            currentUserId = "test_user"
        )
        
        binding.testRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@TestActivity)
            adapter = postAdapter
        }
    }
    
    private fun loadPosts() {
        firebaseRepository = FirebaseRepository()
        
        firebaseRepository.getPostsRealTime { posts ->
            Log.d("TestActivity", "Received ${posts.size} posts")
            runOnUiThread {
                postAdapter.updatePosts(posts)
            }
        }
    }
}
