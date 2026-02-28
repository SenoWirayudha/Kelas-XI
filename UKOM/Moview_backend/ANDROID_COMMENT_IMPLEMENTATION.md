# Android Implementation: Comment Flag & Delete Feature

## Overview
Implementasi fitur untuk melaporkan (flag) dan menghapus komentar pada review dengan menampilkan "Comment removed" untuk komentar yang dihapus.

## API Endpoints

### 1. Get Review Comments
**Endpoint:** `GET /api/reviews/{reviewId}/comments`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "review_id": 45,
      "user_id": 10,
      "content": "Great review!",  // or "Comment removed" if deleted
      "parent_id": null,
      "status": "published",  // published, deleted, flagged
      "created_at": "2026-02-25 10:30:00",
      "username": "john_doe",
      "display_name": "John Doe",
      "profile_photo": "path/to/photo.jpg",
      "replies": []
    }
  ]
}
```

**Status Values:**
- `published` - Normal comment
- `deleted` - Deleted by user (shows "Comment removed")
- `flagged` - Reported by other users
- `hidden` - Hidden by admin (not shown in API)

### 2. Delete Comment (User's Own Comment)
**Endpoint:** `DELETE /api/users/{userId}/comments/{commentId}`

**Description:** Marks comment as deleted, content replaced with "Comment removed"

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### 3. Flag Comment (Report Inappropriate Comment)
**Endpoint:** `POST /api/users/{userId}/comments/{commentId}/flag`

**Description:** Report comment to admin (user cannot flag their own comment)

**Response:**
```json
{
  "success": true,
  "message": "Comment has been flagged for review"
}
```

**Error (if trying to flag own comment):**
```json
{
  "success": false,
  "message": "You cannot flag your own comment"
}
```

## Android UI Implementation

### 1. Comment Item Layout
Update comment item to show three-dot menu button:

```xml
<!-- res/layout/item_review_comment.xml -->
<androidx.constraintlayout.widget.ConstraintLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content">
    
    <!-- Existing comment content -->
    <TextView
        android:id="@+id/tvCommentContent"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:text="@{comment.content}" />
    
    <!-- Three-dot menu button -->
    <ImageButton
        android:id="@+id/btnCommentMenu"
        android:layout_width="24dp"
        android:layout_height="24dp"
        android:background="?attr/selectableItemBackgroundBorderless"
        android:src="@drawable/ic_more_vert"
        android:contentDescription="More options"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintTop_toTopOf="parent" />
        
</androidx.constraintlayout.widget.ConstraintLayout>
```

### 2. Bottom Sheet Menu
Create bottom sheet for comment options:

```xml
<!-- res/layout/bottom_sheet_comment_options.xml -->
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:padding="16dp">
    
    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Comment Options"
        android:textSize="18sp"
        android:textStyle="bold"
        android:paddingBottom="16dp" />
    
    <!-- Show for OWN comments -->
    <LinearLayout
        android:id="@+id/layoutDeleteComment"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:padding="12dp"
        android:clickable="true"
        android:background="?attr/selectableItemBackground">
        
        <ImageView
            android:layout_width="24dp"
            android:layout_height="24dp"
            android:src="@drawable/ic_delete"
            android:tint="@color/red_500" />
            
        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:layout_marginStart="16dp"
            android:text="Delete Comment"
            android:textColor="@color/red_500" />
    </LinearLayout>
    
    <!-- Show for OTHER users' comments -->
    <LinearLayout
        android:id="@+id/layoutFlagComment"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:padding="12dp"
        android:clickable="true"
        android:background="?attr/selectableItemBackground">
        
        <ImageView
            android:layout_width="24dp"
            android:layout_height="24dp"
            android:src="@drawable/ic_flag"
            android:tint="@color/orange_500" />
            
        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:layout_marginStart="16dp"
            android:text="Report Comment"
            android:textColor="@color/orange_500" />
    </LinearLayout>
    
</LinearLayout>
```

### 3. Adapter Implementation

```kotlin
class CommentAdapter(
    private val currentUserId: Int,
    private val onDeleteClick: (Comment) -> Unit,
    private val onFlagClick: (Comment) -> Unit
) : RecyclerView.Adapter<CommentAdapter.ViewHolder>() {

    inner class ViewHolder(val binding: ItemReviewCommentBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(comment: Comment) {
            // Set comment content
            binding.tvCommentContent.text = if (comment.status == "deleted") {
                binding.tvCommentContent.setTextColor(Color.GRAY)
                binding.tvCommentContent.setTypeface(null, Typeface.ITALIC)
                "Comment removed"
            } else {
                binding.tvCommentContent.setTextColor(Color.BLACK)
                binding.tvCommentContent.setTypeface(null, Typeface.NORMAL)
                comment.content
            }
            
            // Show menu button only for non-deleted comments
            if (comment.status == "deleted") {
                binding.btnCommentMenu.visibility = View.GONE
            } else {
                binding.btnCommentMenu.visibility = View.VISIBLE
                binding.btnCommentMenu.setOnClickListener {
                    showCommentOptions(comment)
                }
            }
        }
        
        private fun showCommentOptions(comment: Comment) {
            val bottomSheet = BottomSheetDialog(itemView.context)
            val view = LayoutInflater.from(itemView.context)
                .inflate(R.layout.bottom_sheet_comment_options, null)
            
            val layoutDelete = view.findViewById<LinearLayout>(R.id.layoutDeleteComment)
            val layoutFlag = view.findViewById<LinearLayout>(R.id.layoutFlagComment)
            
            // Show delete option only for own comments
            if (comment.user_id == currentUserId) {
                layoutDelete.visibility = View.VISIBLE
                layoutFlag.visibility = View.GONE
                
                layoutDelete.setOnClickListener {
                    bottomSheet.dismiss()
                    onDeleteClick(comment)
                }
            } else {
                // Show flag option only for other users' comments
                layoutDelete.visibility = View.GONE
                layoutFlag.visibility = View.VISIBLE
                
                layoutFlag.setOnClickListener {
                    bottomSheet.dismiss()
                    onFlagClick(comment)
                }
            }
            
            bottomSheet.setContentView(view)
            bottomSheet.show()
        }
    }
}
```

### 4. API Service Implementation

```kotlin
interface ApiService {
    @GET("reviews/{reviewId}/comments")
    suspend fun getReviewComments(
        @Path("reviewId") reviewId: Int
    ): Response<CommentResponse>
    
    @DELETE("users/{userId}/comments/{commentId}")
    suspend fun deleteComment(
        @Path("userId") userId: Int,
        @Path("commentId") commentId: Int
    ): Response<BaseResponse>
    
    @POST("users/{userId}/comments/{commentId}/flag")
    suspend fun flagComment(
        @Path("userId") userId: Int,
        @Path("commentId") commentId: Int
    ): Response<BaseResponse>
}
```

### 5. ViewModel/Repository Implementation

```kotlin
class ReviewDetailViewModel : ViewModel() {
    
    fun deleteComment(userId: Int, commentId: Int) {
        viewModelScope.launch {
            try {
                val response = repository.deleteComment(userId, commentId)
                if (response.isSuccessful && response.body()?.success == true) {
                    // Refresh comments list
                    loadComments()
                    _message.value = "Comment deleted"
                } else {
                    _message.value = "Failed to delete comment"
                }
            } catch (e: Exception) {
                _message.value = "Error: ${e.message}"
            }
        }
    }
    
    fun flagComment(userId: Int, commentId: Int) {
        viewModelScope.launch {
            try {
                val response = repository.flagComment(userId, commentId)
                if (response.isSuccessful && response.body()?.success == true) {
                    _message.value = "Comment has been reported"
                } else {
                    _message.value = response.body()?.message ?: "Failed to report comment"
                }
            } catch (e: Exception) {
                _message.value = "Error: ${e.message}"
            }
        }
    }
}
```

### 6. Activity/Fragment Usage

```kotlin
class ReviewDetailActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val adapter = CommentAdapter(
            currentUserId = getCurrentUserId(),
            onDeleteClick = { comment ->
                showDeleteConfirmation(comment)
            },
            onFlagClick = { comment ->
                showFlagConfirmation(comment)
            }
        )
        
        binding.rvComments.adapter = adapter
    }
    
    private fun showDeleteConfirmation(comment: Comment) {
        AlertDialog.Builder(this)
            .setTitle("Delete Comment")
            .setMessage("Are you sure you want to delete this comment?")
            .setPositiveButton("Delete") { _, _ ->
                viewModel.deleteComment(getCurrentUserId(), comment.id)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun showFlagConfirmation(comment: Comment) {
        AlertDialog.Builder(this)
            .setTitle("Report Comment")
            .setMessage("Report this comment as inappropriate?")
            .setPositiveButton("Report") { _, _ ->
                viewModel.flagComment(getCurrentUserId(), comment.id)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
```

## Data Model

```kotlin
data class Comment(
    val id: Int,
    val review_id: Int,
    val user_id: Int,
    val content: String,
    val parent_id: Int?,
    val status: String,  // "published", "deleted", "flagged"
    val created_at: String,
    val username: String,
    val display_name: String?,
    val profile_photo: String?,
    val replies: List<Comment> = emptyList()
)

data class CommentResponse(
    val success: Boolean,
    val data: List<Comment>
)

data class BaseResponse(
    val success: Boolean,
    val message: String
)
```

## Visual Behavior

### Normal Comment
```
┌─────────────────────────────────────────────┐
│ John Doe                           ⋮        │
│ Great movie! Loved it!                      │
│ 2 hours ago                                 │
└─────────────────────────────────────────────┘
```

### Deleted Comment (shows "Comment removed")
```
┌─────────────────────────────────────────────┐
│ John Doe                                    │
│ Comment removed (italic, gray)              │
│ 2 hours ago                                 │
└─────────────────────────────────────────────┘
```

### Three-dot Menu (Own Comment)
```
┌─────────────────────────────┐
│ Comment Options             │
├─────────────────────────────┤
│ 🗑️  Delete Comment          │
└─────────────────────────────┘
```

### Three-dot Menu (Other User's Comment)
```
┌─────────────────────────────┐
│ Comment Options             │
├─────────────────────────────┤
│ 🚩  Report Comment          │
└─────────────────────────────┘
```

## Testing Checklist

- [ ] Comment list displays correctly with status
- [ ] Deleted comments show "Comment removed" in gray italic
- [ ] Three-dot menu appears only on non-deleted comments
- [ ] Own comments show "Delete" option
- [ ] Other users' comments show "Report" option
- [ ] Delete confirmation dialog works
- [ ] Flag confirmation dialog works
- [ ] API calls successful for delete
- [ ] API calls successful for flag
- [ ] Cannot flag own comment (error handling)
- [ ] Comments refresh after delete
- [ ] Deleted comment updates to show "Comment removed"

## Notes

1. **Status Logic:**
   - `published` = Normal comment
   - `deleted` = User deleted (shows "Comment removed")
   - `flagged` = Reported by users (still visible but marked)
   - `hidden` = Admin removed (not shown in API)

2. **Permissions:**
   - Users can only delete their OWN comments
   - Users can only flag OTHER users' comments
   - Users cannot flag their own comments

3. **UI States:**
   - Deleted comments: Gray, italic text, no menu button
   - Flagged comments: Show normally (admin handles in web panel)
   - Hidden comments: Not returned by API

4. **Admin Notification:**
   - When a comment is flagged, admin sees it in web dashboard
   - Admin can see flagged count in notification area
   - Admin can restore or permanently delete flagged comments
