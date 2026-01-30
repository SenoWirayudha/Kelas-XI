<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->get();
        
        // Calculate stats
        $totalUsers = User::count();
        $activeToday = User::where('status', 'active')
            ->whereDate('updated_at', today())
            ->count();
        $newThisMonth = User::whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();
        
        // Count reviews for each user
        foreach ($users as $user) {
            $user->reviews_count = $user->reviews()->where('status', 'published')->count();
        }
        
        return view('admin.users.index', compact('users', 'totalUsers', 'activeToday', 'newThisMonth'));
    }
}
