<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

Route::get('/test-auth', function () {
    $user = User::where('email', 'admin@admin.com')->first();
    
    if ($user) {
        Auth::login($user);
        return redirect('/admin');
    }
    
    return 'User not found';
});
