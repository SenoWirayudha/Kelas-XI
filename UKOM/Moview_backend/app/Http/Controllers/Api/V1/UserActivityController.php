<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserActivityController extends Controller
{
    /**
     * Get user films (rated/watched movies)
     */
    public function getFilms($userId)
    {
        try {
            $films = DB::table('ratings')
                ->join('movies', 'ratings.film_id', '=', 'movies.id')
                ->leftJoin('movie_media', function($join) {
                    $join->on('movies.id', '=', 'movie_media.movie_id')
                         ->where('movie_media.media_type', '=', 'poster')
                         ->where('movie_media.is_default', '=', 1);
                })
                ->where('ratings.user_id', $userId)
                ->select(
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path',
                    'ratings.rating',
                    'ratings.created_at as rated_at'
                )
                ->orderBy('ratings.created_at', 'desc')
                ->get();

            // Build poster URLs with base URL
            $filmsData = $films->map(function($film) {
                $posterUrl = null;
                if ($film->media_path) {
                    if (!str_starts_with($film->media_path, 'http')) {
                        $posterUrl = "http://10.0.2.2:8000/storage/{$film->media_path}";
                    } else {
                        $posterUrl = $film->media_path;
                    }
                }
                
                return [
                    'id' => $film->id,
                    'title' => $film->title,
                    'year' => $film->year,
                    'poster_path' => $posterUrl,
                    'rating' => $film->rating,
                    'rated_at' => $film->rated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $filmsData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch films: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user diary entries
     */
    public function getDiary($userId)
    {
        try {
            $diaries = DB::table('diaries')
                ->join('movies', 'diaries.film_id', '=', 'movies.id')
                ->leftJoin('movie_media', function($join) {
                    $join->on('movies.id', '=', 'movie_media.movie_id')
                         ->where('movie_media.media_type', '=', 'poster')
                         ->where('movie_media.is_default', '=', 1);
                })
                ->leftJoin('ratings', function($join) use ($userId) {
                    $join->on('diaries.film_id', '=', 'ratings.film_id')
                         ->where('ratings.user_id', '=', $userId);
                })
                ->where('diaries.user_id', $userId)
                ->select(
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path',
                    'diaries.watched_at',
                    'diaries.note',
                    'ratings.rating'
                )
                ->orderBy('diaries.watched_at', 'desc')
                ->get();

            // Build poster URLs with base URL
            $diariesData = $diaries->map(function($diary) {
                $posterUrl = null;
                if ($diary->media_path) {
                    if (!str_starts_with($diary->media_path, 'http')) {
                        $posterUrl = "http://10.0.2.2:8000/storage/{$diary->media_path}";
                    } else {
                        $posterUrl = $diary->media_path;
                    }
                }
                
                return [
                    'id' => $diary->id,
                    'title' => $diary->title,
                    'year' => $diary->year,
                    'poster_path' => $posterUrl,
                    'watched_at' => $diary->watched_at,
                    'note' => $diary->note,
                    'rating' => $diary->rating
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $diariesData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch diary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user reviews
     */
    public function getReviews($userId)
    {
        try {
            $reviews = DB::table('reviews')
                ->join('movies', 'reviews.film_id', '=', 'movies.id')
                ->leftJoin('movie_media', function($join) {
                    $join->on('movies.id', '=', 'movie_media.movie_id')
                         ->where('movie_media.media_type', '=', 'poster')
                         ->where('movie_media.is_default', '=', 1);
                })
                ->where('reviews.user_id', $userId)
                ->where('reviews.status', 'published')
                ->select(
                    'reviews.id as review_id',
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path as poster_path',
                    'reviews.rating',
                    'reviews.title as review_title',
                    'reviews.content',
                    'reviews.is_spoiler',
                    'reviews.created_at'
                )
                ->orderBy('reviews.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reviews
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reviews: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user liked movies
     */
    public function getLikes($userId)
    {
        try {
            $likes = DB::table('movie_likes')
                ->join('movies', 'movie_likes.film_id', '=', 'movies.id')
                ->leftJoin('movie_media', function($join) {
                    $join->on('movies.id', '=', 'movie_media.movie_id')
                         ->where('movie_media.media_type', '=', 'poster')
                         ->where('movie_media.is_default', '=', 1);
                })
                ->where('movie_likes.user_id', $userId)
                ->select(
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path as poster_path',
                    'movie_likes.created_at as liked_at'
                )
                ->orderBy('movie_likes.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $likes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch likes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user watchlist
     */
    public function getWatchlist($userId)
    {
        try {
            $watchlist = DB::table('watchlists')
                ->join('movies', 'watchlists.film_id', '=', 'movies.id')
                ->leftJoin('movie_media', function($join) {
                    $join->on('movies.id', '=', 'movie_media.movie_id')
                         ->where('movie_media.media_type', '=', 'poster')
                         ->where('movie_media.is_default', '=', 1);
                })
                ->where('watchlists.user_id', $userId)
                ->select(
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path',
                    'watchlists.created_at as added_at'
                )
                ->orderBy('watchlists.created_at', 'desc')
                ->get();

            // Build poster URLs with base URL
            $watchlistData = $watchlist->map(function($item) {
                $posterUrl = null;
                if ($item->media_path) {
                    if (!str_starts_with($item->media_path, 'http')) {
                        $posterUrl = "http://10.0.2.2:8000/storage/{$item->media_path}";
                    } else {
                        $posterUrl = $item->media_path;
                    }
                }
                
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'year' => $item->year,
                    'poster_path' => $posterUrl,
                    'added_at' => $item->added_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $watchlistData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch watchlist: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user followers
     */
    public function getFollowers($userId)
    {
        try {
            $followers = DB::table('followers')
                ->join('users', 'followers.follower_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->where('followers.user_id', $userId)
                ->select(
                    'users.id',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo',
                    'user_profiles.bio',
                    'followers.created_at as followed_at'
                )
                ->orderBy('followers.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $followers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch followers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user following
     */
    public function getFollowing($userId)
    {
        try {
            $following = DB::table('followers')
                ->join('users', 'followers.user_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->where('followers.follower_id', $userId)
                ->select(
                    'users.id',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo',
                    'user_profiles.bio',
                    'followers.created_at as followed_at'
                )
                ->orderBy('followers.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $following
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch following: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save or update user rating for a movie
     */
    public function saveRating(Request $request, $userId, $movieId)
    {
        try {
            \Log::info("Save Rating Request", [
                'userId' => $userId,
                'movieId' => $movieId,
                'body' => $request->all()
            ]);
            
            $rating = $request->input('rating', 0); // Default 0 if only marking as watched
            
            // Validate rating (0-5 scale for star rating)
            if ($rating < 0 || $rating > 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rating must be between 0 and 5 stars'
                ], 400);
            }
            
            // Check if rating already exists
            $existingRating = DB::table('ratings')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->first();
            
            if ($existingRating) {
                // Update existing rating
                DB::table('ratings')
                    ->where('user_id', $userId)
                    ->where('film_id', $movieId)
                    ->update([
                        'rating' => $rating,
                        'updated_at' => now()
                    ]);
            } else {
                // Create new rating
                DB::table('ratings')->insert([
                    'user_id' => $userId,
                    'film_id' => $movieId,
                    'rating' => $rating,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            \Log::info("Rating saved successfully", [
                'userId' => $userId,
                'movieId' => $movieId,
                'rating' => $rating
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Rating saved successfully',
                'data' => [
                    'rating' => $rating
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error("Failed to save rating", [
                'error' => $e->getMessage(),
                'userId' => $userId,
                'movieId' => $movieId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save rating: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user rating for a movie
     */
    public function getRating($userId, $movieId)
    {
        try {
            $rating = DB::table('ratings')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->first(['rating', 'created_at', 'updated_at']);
            
            if ($rating) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'rating' => $rating->rating,
                        'created_at' => $rating->created_at,
                        'updated_at' => $rating->updated_at,
                        'is_watched' => true
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'rating' => null,
                        'is_watched' => false
                    ]
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get rating: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user rating for a movie
     */
    public function deleteRating($userId, $movieId)
    {
        try {
            $deleted = DB::table('ratings')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->delete();
            
            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Rating deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Rating not found'
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete rating: ' . $e->getMessage()
            ], 500);
        }
    }
}

