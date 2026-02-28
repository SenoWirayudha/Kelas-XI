<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReviewComment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        // Get filter parameters
        $search = $request->input('search');
        $status = $request->input('status');
        
        // Build query
        $query = ReviewComment::with(['user', 'review.movie']);
        
        // Apply search filter (search in content or username)
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('content', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('username', 'like', "%{$search}%");
                  });
            });
        }
        
        // Apply status filter
        if ($status) {
            $query->where('status', $status);
        }
        
        // Order by latest first
        $comments = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();
        
        // Get flagged count for notification badge
        $flaggedCount = ReviewComment::where('status', 'flagged')->count();
        
        return view('admin.comments.index', compact('comments', 'flaggedCount'));
    }
    
    public function flag($id)
    {
        $comment = ReviewComment::findOrFail($id);
        $comment->status = 'flagged';
        $comment->save();
        
        return redirect()->back()->with('success', 'Comment flagged successfully!');
    }
    
    public function delete($id)
    {
        $comment = ReviewComment::findOrFail($id);
        $comment->status = 'deleted';
        $comment->save();
        
        return redirect()->back()->with('success', 'Comment marked as deleted!');
    }
    
    public function restore($id)
    {
        $comment = ReviewComment::findOrFail($id);
        $comment->status = 'published';
        $comment->save();
        
        return redirect()->back()->with('success', 'Comment restored!');
    }
    
    public function notifications()
    {
        // Get recent flagged comments (last 10)
        $flaggedComments = ReviewComment::with(['user', 'review.movie'])
            ->where('status', 'flagged')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();
            
        $flaggedCount = $flaggedComments->count();
        
        return view('admin.partials.notifications', compact('flaggedComments', 'flaggedCount'));
    }
}
