package com.komputerkit.socialmediaapp

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.komputerkit.socialmediaapp.adapter.PostAdapter
import com.komputerkit.socialmediaapp.model.Post
import com.komputerkit.socialmediaapp.viewmodel.UserViewModel

class SimpleMainActivity : AppCompatActivity() {
    
    private lateinit var postsRecyclerView: RecyclerView
    private lateinit var postAdapter: PostAdapter
    private lateinit var userViewModel: UserViewModel
    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d("SimpleMainActivity", "Starting simple main activity")
        
        userViewModel = ViewModelProvider(this)[UserViewModel::class.java]
        
        // Create simple layout programmatically
        postsRecyclerView = RecyclerView(this)
        postsRecyclerView.layoutParams = RecyclerView.LayoutParams(
            RecyclerView.LayoutParams.MATCH_PARENT,
            RecyclerView.LayoutParams.MATCH_PARENT
        )
        
        setContentView(postsRecyclerView)
        
        setupRecyclerView()
        loadPosts()
    }
    
    private fun setupRecyclerView() {
        Log.d("SimpleMainActivity", "Setting up RecyclerView")
        
        postAdapter = PostAdapter(
            posts = emptyList(),
            onLikeClick = { post -> Log.d("SimpleMainActivity", "Like clicked: ${post.id}") },
            onCommentClick = { post -> Log.d("SimpleMainActivity", "Comment clicked: ${post.id}") },
            onShareClick = { post -> Log.d("SimpleMainActivity", "Share clicked: ${post.id}") },
            onSaveClick = { post -> Log.d("SimpleMainActivity", "Save clicked: ${post.id}") },
            onProfileClick = { userId -> Log.d("SimpleMainActivity", "Profile clicked: $userId") },
            onDeleteClick = { post -> Log.d("SimpleMainActivity", "Delete clicked: ${post.id}") },
            getUserForPost = { userId -> userViewModel.getUserById(userId) },
            lifecycleOwner = this,
            currentUserId = auth.currentUser?.uid ?: ""
        )
        
        postsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@SimpleMainActivity)
            adapter = postAdapter
        }
        
        Log.d("SimpleMainActivity", "RecyclerView setup complete")
    }
    
    private fun loadPosts() {
        Log.d("SimpleMainActivity", "Loading posts from Firestore...")
        
        firestore.collection("posts")
            .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { documents ->
                Log.d("SimpleMainActivity", "Retrieved ${documents.size()} posts")
                
                val posts = documents.mapNotNull { document ->
                    try {
                        val post = document.toObject(Post::class.java).copy(id = document.id)
                        Log.d("SimpleMainActivity", "Parsed post: ${post.id} - ${post.description}")
                        post
                    } catch (e: Exception) {
                        Log.e("SimpleMainActivity", "Error parsing post: ${document.id}", e)
                        null
                    }
                }
                
                Log.d("SimpleMainActivity", "Updating adapter with ${posts.size} posts")
                postAdapter.updatePosts(posts)
            }
            .addOnFailureListener { exception ->
                Log.e("SimpleMainActivity", "Error loading posts", exception)
            }
    }
}
