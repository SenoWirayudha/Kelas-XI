<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\FilmController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\CastCrewController;
use App\Http\Controllers\Admin\CastCrewManagementController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\AuthController;

// Public Routes
Route::get('/', function () {
    return view('welcome');
});

// Admin Authentication
Route::get('/admin/login', [AuthController::class, 'showLoginForm'])->name('admin.login');
Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.post');
Route::post('/admin/logout', [AuthController::class, 'logout'])->name('admin.logout');

// Admin root redirect
Route::get('/admin', function () {
    if (session()->has('admin_logged_in')) {
        return redirect()->route('admin.films.index');
    }
    return redirect()->route('admin.login');
})->name('admin.index');

// Admin Routes (Protected)
Route::prefix('admin')->name('admin.')->middleware('admin.auth')->group(function () {
    // Film Management
    Route::get('/films', [FilmController::class, 'index'])->name('films.index');
    Route::get('/films/create', [FilmController::class, 'create'])->name('films.create');
    Route::post('/films', [FilmController::class, 'store'])->name('films.store');
    Route::get('/films/{id}', [FilmController::class, 'show'])->name('films.show');
    Route::get('/films/{id}/edit', [FilmController::class, 'edit'])->name('films.edit');
    Route::put('/films/{id}', [FilmController::class, 'update'])->name('films.update');
    Route::delete('/films/{id}', [FilmController::class, 'destroy'])->name('films.destroy');
    Route::put('/films/{id}/toggle-status', [FilmController::class, 'toggleStatus'])->name('films.toggle-status');
    Route::post('/films/{id}/duplicate', [FilmController::class, 'duplicate'])->name('films.duplicate');
    Route::get('/films/{id}/cast-crew', [FilmController::class, 'castCrew'])->name('films.cast-crew');
    Route::get('/films/{id}/reviews', [FilmController::class, 'reviews'])->name('films.reviews');
    
    // Media Management (Upload, Set Default, Delete)
    Route::post('/films/{id}/media', [MediaController::class, 'upload'])->name('films.media.upload');
    Route::put('/films/{id}/media/{mediaId}/default', [MediaController::class, 'setDefault'])->name('films.media.setDefault');
    Route::delete('/films/{id}/media/{mediaId}', [MediaController::class, 'delete'])->name('films.media.delete');
    
    // Services Management
    Route::put('/films/{id}/services', [FilmController::class, 'updateServices'])->name('films.services.update');
    
    // Cast & Crew Management
    Route::get('/persons', [CastCrewController::class, 'getPersons'])->name('persons.list');
    Route::post('/films/{id}/cast-crew', [CastCrewController::class, 'store'])->name('films.castcrew.store');
    Route::delete('/films/{id}/cast-crew/{moviePersonId}', [CastCrewController::class, 'destroy'])->name('films.castcrew.destroy');
    
    // Users Management (UI only - dummy data)
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    
    // User Activity
    Route::get('/activity', [ActivityController::class, 'index'])->name('activity.index');
    
    // Cast & Crew Management
    Route::get('/cast-crew', [CastCrewManagementController::class, 'index'])->name('cast-crew.index');
    Route::get('/cast-crew/add', [CastCrewManagementController::class, 'create'])->name('cast-crew.add');
    Route::post('/cast-crew', [CastCrewManagementController::class, 'store'])->name('cast-crew.store');
    Route::get('/cast-crew/{id}', [CastCrewManagementController::class, 'show'])->name('cast-crew.show');
    Route::get('/cast-crew/{id}/edit', [CastCrewManagementController::class, 'edit'])->name('cast-crew.edit');
    Route::put('/cast-crew/{id}', [CastCrewManagementController::class, 'update'])->name('cast-crew.update');
    Route::delete('/cast-crew/{id}', [CastCrewManagementController::class, 'destroy'])->name('cast-crew.destroy');
    
    // Reviews Management
    Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews.index');
    
    // Analytics (UI only - dummy data)
    Route::get('/analytics', function () {
        return view('admin.analytics.index');
    })->name('analytics.index');
});
