<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MovieApiController;
use App\Http\Controllers\Api\FilmListController;
use App\Http\Controllers\Api\V1\MovieMediaController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\UserActivityController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public API endpoints for Android app
Route::prefix('v1')->group(function () {
    // Authentication
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Home Screen
    Route::get('/home', [MovieApiController::class, 'home']);
    Route::get('/popular', [MovieApiController::class, 'popular']);
    Route::get('/recent-reviews', [MovieApiController::class, 'recentReviews']);
    
    // Movies
    Route::get('/movies', [MovieApiController::class, 'index']);
    Route::get('/movies/{id}', [MovieApiController::class, 'show']);
    Route::get('/movies/{id}/reviews', [MovieApiController::class, 'reviews']);
    Route::get('/movies/{id}/cast-crew', [MovieApiController::class, 'castCrew']);
    Route::get('/movies/{id}/media', [MovieMediaController::class, 'getMovieMedia']);
    
    // Persons (Cast & Crew)
    Route::get('/persons/{id}', [MovieApiController::class, 'personDetail']);
    
    // Profile
    Route::get('/users/{userId}/profile', [ProfileController::class, 'getProfile']);
    Route::put('/users/{userId}/profile', [ProfileController::class, 'updateProfile']);
    Route::post('/users/{userId}/profile/photo', [ProfileController::class, 'uploadProfilePhoto']);
    Route::delete('/users/{userId}/profile/photo', [ProfileController::class, 'deleteProfilePhoto']);
    Route::get('/users/{userId}/profile/photo/image', [ProfileController::class, 'getProfilePhoto']);
    Route::put('/users/{userId}/profile/backdrop', [ProfileController::class, 'updateBackdrop']);
    Route::put('/users/{userId}/favorites', [ProfileController::class, 'updateFavorites']);
    Route::get('/users/{userId}/favorites', [ProfileController::class, 'getFavorites']);
    
    // User Activity
    Route::get('/users/{userId}/films', [UserActivityController::class, 'getFilms']);
    
    // Diary routes - specific before general
    Route::get('users/{userId}/diary/{diaryId}', [UserActivityController::class, 'getDiaryDetail'])->where('diaryId', '[0-9]+');
    Route::get('users/{userId}/diary', [UserActivityController::class, 'getDiary']);
    Route::delete('users/{userId}/diary/{diaryId}', [UserActivityController::class, 'deleteDiary'])->where('diaryId', '[0-9]+');
    
    // Reviews routes - specific before general
    Route::get('users/{userId}/reviews/{reviewId}', [UserActivityController::class, 'getReviewDetail'])->where('reviewId', '[0-9]+');
    Route::get('users/{userId}/reviews', [UserActivityController::class, 'getReviews']);
    
    Route::get('/users/{userId}/likes', [UserActivityController::class, 'getLikes']);
    Route::get('/users/{userId}/watchlist', [UserActivityController::class, 'getWatchlist']);
    Route::get('/users/{userId}/followers', [UserActivityController::class, 'getFollowers']);
    Route::get('/users/{userId}/following', [UserActivityController::class, 'getFollowing']);
    
    // Ratings
    Route::post('/users/{userId}/movies/{movieId}/rating', [UserActivityController::class, 'saveRating']);
    Route::get('/users/{userId}/movies/{movieId}/rating', [UserActivityController::class, 'getRating']);
    Route::delete('/users/{userId}/movies/{movieId}/rating', [UserActivityController::class, 'deleteRating']);
    
    // Likes
    Route::post('/users/{userId}/movies/{movieId}/like', [UserActivityController::class, 'toggleLike']);
    Route::get('/users/{userId}/movies/{movieId}/like', [UserActivityController::class, 'checkLike']);
    
    // Watchlist
    Route::post('/users/{userId}/movies/{movieId}/watchlist', [UserActivityController::class, 'toggleWatchlist']);
    Route::get('/users/{userId}/movies/{movieId}/watchlist', [UserActivityController::class, 'checkWatchlist']);
    
    // Reviews
    Route::post('/users/{userId}/movies/{movieId}/review', [UserActivityController::class, 'saveReview']);
    Route::put('users/{userId}/reviews/{reviewId}', [UserActivityController::class, 'updateReview'])->where('reviewId', '[0-9]+');
    Route::delete('users/{userId}/reviews/{reviewId}', [UserActivityController::class, 'deleteReview'])->where('reviewId', '[0-9]+');
    
    // Review Comments
    Route::get('reviews/{reviewId}/comments', [UserActivityController::class, 'getReviewComments'])->where('reviewId', '[0-9]+');
    Route::post('users/{userId}/reviews/{reviewId}/comments', [UserActivityController::class, 'addReviewComment'])->where('reviewId', '[0-9]+');
    
    // Film List by Category
    Route::get('/films/category', [FilmListController::class, 'getFilmsByCategory']);
    
    // Search
    Route::get('/search', [MovieApiController::class, 'search']);
});
