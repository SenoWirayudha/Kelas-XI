<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserActivity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index()
    {
        $activities = UserActivity::with(['user', 'movie'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Calculate stats by type
        $stats = [
            'watched' => UserActivity::where('type', 'watched')->count(),
            'logged' => UserActivity::where('type', 'logged')->count(),
            'reviewed' => UserActivity::where('type', 'reviewed')->count(),
            'watchlist' => UserActivity::where('type', 'watchlist')->count(),
            'media' => UserActivity::where('type', 'media')->count(),
            'likes' => UserActivity::where('type', 'like')->count(),
            'comments' => UserActivity::where('type', 'comment')->count(),
        ];
        
        return view('admin.activity.index', compact('activities', 'stats'));
    }
}
