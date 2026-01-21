<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\FilmController;

// Public Routes
Route::get('/', function () {
    return view('welcome');
});

// Admin Authentication (UI only - dummy)
Route::get('/admin/login', function () {
    return view('admin.auth.login');
})->name('admin.login');

Route::post('/admin/login', function () {
    // UI only - no actual authentication
    // In production: validate credentials, create session, etc.
    return redirect()->route('admin.films.index');
})->name('admin.login.post');

// Admin Routes
Route::prefix('admin')->name('admin.')->group(function () {
    // Film Management
    Route::get('/films', [FilmController::class, 'index'])->name('films.index');
    Route::get('/films/create', [FilmController::class, 'create'])->name('films.create');
    Route::get('/films/{id}', [FilmController::class, 'show'])->name('films.show');
    Route::get('/films/{id}/edit', [FilmController::class, 'edit'])->name('films.edit');
    Route::get('/films/{id}/cast-crew', [FilmController::class, 'castCrew'])->name('films.cast-crew');
    Route::get('/films/{id}/reviews', [FilmController::class, 'reviews'])->name('films.reviews');
    
    // Users Management (UI only - dummy data)
    Route::get('/users', function () {
        return view('admin.users.index');
    })->name('users.index');
    
    // User Activity (UI only - dummy data)
    Route::get('/activity', function () {
        return view('admin.activity.index');
    })->name('activity.index');
    
    // Cast & Crew Management (UI only - dummy data)
    Route::get('/cast-crew', function () {
        return view('admin.cast-crew.index');
    })->name('cast-crew.index');
    
    Route::get('/cast-crew/add', function () {
        return view('admin.cast-crew.add');
    })->name('cast-crew.add');
    
    // Reviews Management (UI only - dummy data)
    Route::get('/reviews', function () {
        return view('admin.reviews.index');
    })->name('reviews.index');
    
    // Analytics (UI only - dummy data)
    Route::get('/analytics', function () {
        return view('admin.analytics.index');
    })->name('analytics.index');
});
