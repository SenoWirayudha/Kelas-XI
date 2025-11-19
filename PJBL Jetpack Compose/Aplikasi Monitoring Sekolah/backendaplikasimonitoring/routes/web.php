<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

Route::get('/', function () {
    return view('welcome');
});

// Test route untuk auto login
Route::get('/test-login', function () {
    $user = User::where('email', 'admin@sekolah.com')->first();
    
    if ($user) {
        Auth::login($user, true);
        return redirect('/admin');
    }
    
    return 'User not found';
});

// Route untuk logout
Route::get('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/admin/login')->with('status', 'Logged out successfully!');
});

// Debug login route
Route::post('/debug-login', function (Request $request) {
    $email = $request->input('email');
    $password = $request->input('password');
    
    $user = User::where('email', $email)->first();
    
    $debug = [
        'email_provided' => $email,
        'user_found' => $user ? 'YES' : 'NO',
    ];
    
    if ($user) {
        $debug['user_id'] = $user->id;
        $debug['user_name'] = $user->name;
        $debug['user_role'] = $user->role;
        $debug['password_check'] = Hash::check($password, $user->password) ? 'CORRECT' : 'WRONG';
        $debug['can_access_panel'] = $user->canAccessPanel(new stdClass) ? 'YES' : 'NO';
        
        // Try to login
        if (Auth::attempt(['email' => $email, 'password' => $password], true)) {
            $debug['auth_attempt'] = 'SUCCESS';
            $debug['auth_user_id'] = Auth::id();
            return response()->json(['success' => true, 'debug' => $debug, 'redirect' => '/admin']);
        } else {
            $debug['auth_attempt'] = 'FAILED';
        }
    }
    
    return response()->json(['success' => false, 'debug' => $debug]);
});

