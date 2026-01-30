<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;

class ReviewController extends Controller
{
    public function index()
    {
        // Get all reviews with user and movie relationships
        $reviews = Review::with(['user', 'movie'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Calculate stats
        $totalReviews = Review::count();
        $pendingReviews = Review::where('status', 'pending')->count();
        $flaggedReviews = Review::where('status', 'flagged')->count();
        
        return view('admin.reviews.index', compact(
            'reviews',
            'totalReviews',
            'pendingReviews',
            'flaggedReviews'
        ));
    }
}
