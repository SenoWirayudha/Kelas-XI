<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        // If already logged in, redirect to films
        if (session()->has('admin_logged_in')) {
            return redirect()->route('admin.films.index');
        }
        
        return view('admin.auth.login');
    }
    
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        
        $user = User::where('email', $request->email)
            ->where('role', 'admin')
            ->first();
        
        if ($user && Hash::check($request->password, $user->password)) {
            // Login successful
            session([
                'admin_logged_in' => true,
                'admin_user_id' => $user->id,
                'admin_user_name' => $user->username,
                'admin_user_email' => $user->email,
            ]);
            
            return redirect()->route('admin.films.index');
        }
        
        // Login failed
        return back()->withErrors([
            'email' => 'Invalid credentials or not an admin account.',
        ])->withInput($request->only('email'));
    }
    
    public function logout()
    {
        session()->flush();
        return redirect()->route('admin.login');
    }
}
