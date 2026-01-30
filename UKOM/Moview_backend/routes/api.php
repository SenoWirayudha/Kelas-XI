<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MovieApiController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public API endpoints for Android app
Route::prefix('v1')->group(function () {
    // Home Screen
    Route::get('/home', [MovieApiController::class, 'home']);
    Route::get('/popular', [MovieApiController::class, 'popular']);
    Route::get('/recent-reviews', [MovieApiController::class, 'recentReviews']);
    
    // Movies
    Route::get('/movies', [MovieApiController::class, 'index']);
    Route::get('/movies/{id}', [MovieApiController::class, 'show']);
    Route::get('/movies/{id}/reviews', [MovieApiController::class, 'reviews']);
    Route::get('/movies/{id}/cast-crew', [MovieApiController::class, 'castCrew']);
    
    // Persons (Cast & Crew)
    Route::get('/persons/{id}', [MovieApiController::class, 'personDetail']);
    
    // Search
    Route::get('/search', [MovieApiController::class, 'search']);
});
