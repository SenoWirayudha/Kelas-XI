<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        // Get filter parameters
        $search = $request->input('search');
        $status = $request->input('status');
        $rating = $request->input('rating');
        $sortBy = $request->input('sort_by', 'latest');
        
        // Build query
        $query = Review::with(['user', 'movie']);
        
        // Apply search filter
        if ($search) {
            $like = '%' . str_replace(['|', '%', '_'], ['||', '|%', '|_'], $search) . '%';
            $query->where(function($q) use ($like) {
                $q->whereRaw("LOWER(content) LIKE LOWER(?) ESCAPE '|'", [$like])
                  ->orWhereRaw("LOWER(title) LIKE LOWER(?) ESCAPE '|'", [$like])
                  ->orWhereHas('user', function($userQuery) use ($like) {
                      $userQuery->whereRaw("LOWER(username) LIKE LOWER(?) ESCAPE '|'", [$like]);
                  })
                  ->orWhereHas('movie', function($movieQuery) use ($like) {
                      $movieQuery->whereRaw("LOWER(title) LIKE LOWER(?) ESCAPE '|'", [$like]);
                  });
            });
        }
        
        // Apply status filter
        if ($status) {
            $query->where('status', $status);
        }
        
        // Apply rating filter
        if ($rating) {
            switch ($rating) {
                case '5':
                    $query->where('rating', '=', 5);
                    break;
                case '4':
                    $query->where('rating', '=', 4);
                    break;
                case '3':
                    $query->where('rating', '=', 3);
                    break;
                case '2':
                    $query->where('rating', '=', 2);
                    break;
                case '1':
                    $query->where('rating', '=', 1);
                    break;
            }
        }
        
        // Apply sorting
        switch ($sortBy) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'highest':
                $query->orderBy('rating', 'desc');
                break;
            case 'lowest':
                $query->orderBy('rating', 'asc');
                break;
            default: // latest
                $query->orderBy('created_at', 'desc');
        }
        
        // Paginate results
        $reviews = $query->paginate(10)->withQueryString();
        
        // Calculate stats (total, not filtered)
        $totalReviews = Review::count();
        $flaggedReviews = Review::where('status', 'flagged')->count();
        
        return view('admin.reviews.index', compact(
            'reviews',
            'totalReviews',
            'flaggedReviews'
        ));
    }
    
    /**
     * Delete a flagged review (hard delete)
     */
    public function delete($id)
    {
        try {
            $review = Review::findOrFail($id);
            
            // Hard delete the review
            $review->delete();
            
            return redirect()->back()->with('success', 'Review deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete review: ' . $e->getMessage());
        }
    }
    
    /**
     * Restore (approve) a flagged review
     */
    public function restore($id)
    {
        try {
            $review = Review::findOrFail($id);
            
            // Set status back to published
            $review->status = 'published';
            $review->save();
            
            return redirect()->back()->with('success', 'Review approved successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to approve review: ' . $e->getMessage());
        }
    }
}
