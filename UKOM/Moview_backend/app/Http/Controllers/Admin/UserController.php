<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // Get filter parameters
        $search = $request->input('search');
        $status = $request->input('status');
        $role = $request->input('role');
        
        // Build query
        $query = User::query();
        
        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Apply status filter
        if ($status) {
            $query->where('status', $status);
        }
        
        // Apply role filter
        if ($role) {
            $query->where('role', $role);
        }
        
        // Paginate results
        $users = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();
        
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
    
    public function ban(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->status = 'banned';
        $user->save();
        
        return redirect()->route('admin.users.index')
            ->with('success', 'User has been banned successfully.');
    }
}
