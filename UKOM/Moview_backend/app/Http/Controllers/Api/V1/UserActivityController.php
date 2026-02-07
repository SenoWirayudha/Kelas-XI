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
            // Get films from ratings and likes (union of both)
            $ratedFilms = DB::table('ratings')
                ->join('movies', 'ratings.film_id', '=', 'movies.id')
                ->leftJoin('movie_media', function($join) {
                    $join->on('movies.id', '=', 'movie_media.movie_id')
                         ->where('movie_media.media_type', '=', 'poster')
                         ->where('movie_media.is_default', '=', 1);
                })
                ->leftJoin('movie_likes', function($join) use ($userId) {
                    $join->on('movies.id', '=', 'movie_likes.film_id')
                         ->where('movie_likes.user_id', '=', $userId);
                })
                ->leftJoin('watchlists', function($join) use ($userId) {
                    $join->on('movies.id', '=', 'watchlists.film_id')
                         ->where('watchlists.user_id', '=', $userId);
                })
                ->where('ratings.user_id', $userId)
                ->select(
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path',
                    'ratings.rating',
                    'ratings.created_at as activity_date',
                    DB::raw('CASE WHEN movie_likes.film_id IS NOT NULL THEN 1 ELSE 0 END as is_liked'),
                    DB::raw('CASE WHEN watchlists.film_id IS NOT NULL THEN 1 ELSE 0 END as is_in_watchlist')
                );

            // Get films that are only liked (not rated)
            $likedOnlyFilms = DB::table('movie_likes')
                ->join('movies', 'movie_likes.film_id', '=', 'movies.id')
                ->leftJoin('movie_media', function($join) {
                    $join->on('movies.id', '=', 'movie_media.movie_id')
                         ->where('movie_media.media_type', '=', 'poster')
                         ->where('movie_media.is_default', '=', 1);
                })
                ->leftJoin('ratings', function($join) use ($userId) {
                    $join->on('movies.id', '=', 'ratings.film_id')
                         ->where('ratings.user_id', '=', $userId);
                })
                ->leftJoin('watchlists', function($join) use ($userId) {
                    $join->on('movies.id', '=', 'watchlists.film_id')
                         ->where('watchlists.user_id', '=', $userId);
                })
                ->where('movie_likes.user_id', $userId)
                ->whereNull('ratings.film_id') // Only get films that DON'T have ratings
                ->select(
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path',
                    DB::raw('NULL as rating'),
                    'movie_likes.created_at as activity_date',
                    DB::raw('1 as is_liked'),
                    DB::raw('CASE WHEN watchlists.film_id IS NOT NULL THEN 1 ELSE 0 END as is_in_watchlist')
                );

            // Combine both queries
            $films = $ratedFilms->union($likedOnlyFilms)
                ->orderBy('activity_date', 'desc')
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
                    'rated_at' => $film->activity_date,
                    'is_liked' => (bool)$film->is_liked,
                    'is_in_watchlist' => (bool)$film->is_in_watchlist
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
     * Get user diary entries (logs and reviews)
     */
    public function getDiary($userId)
    {
        try {
            $diaries = DB::table('diaries')
                ->join('movies', 'diaries.film_id', '=', 'movies.id')
                ->leftJoin('movie_media as poster_media', function($join) {
                    $join->on('movies.id', '=', 'poster_media.movie_id')
                         ->where('poster_media.media_type', '=', 'poster')
                         ->where('poster_media.is_default', '=', 1);
                })
                ->leftJoin('reviews', function($join) use ($userId) {
                    $join->on('diaries.film_id', '=', 'reviews.film_id')
                         ->where('reviews.user_id', '=', $userId);
                })
                ->where('diaries.user_id', $userId)
                ->select(
                    'diaries.id as diary_id',
                    'diaries.film_id',
                    'diaries.watched_at',
                    'diaries.note',
                    'diaries.created_at',
                    'movies.id as movie_id',
                    'movies.title',
                    'movies.release_year as year',
                    'poster_media.media_path as poster_path',
                    'reviews.id as review_id',
                    DB::raw('COALESCE(reviews.rating, diaries.rating) as rating'), // Use review rating first, fallback to diary snapshot
                    'reviews.content as review_content',
                    DB::raw('COALESCE(reviews.is_liked, diaries.is_liked) as is_liked'), // Use review snapshot, fallback to diary snapshot
                    DB::raw('CASE WHEN reviews.content IS NOT NULL THEN "review" ELSE "log" END as type')
                )
                ->orderBy('diaries.watched_at', 'desc')
                ->orderBy('diaries.created_at', 'desc')
                ->get();

            // Build poster URLs with base URL
            $diariesData = $diaries->map(function($diary) {
                $posterUrl = null;
                if ($diary->poster_path) {
                    if (!str_starts_with($diary->poster_path, 'http')) {
                        $posterUrl = "http://10.0.2.2:8000/storage/{$diary->poster_path}";
                    } else {
                        $posterUrl = $diary->poster_path;
                    }
                }
                
                return [
                    'diary_id' => $diary->diary_id,
                    'film_id' => $diary->film_id,
                    'movie_id' => $diary->movie_id,
                    'title' => $diary->title,
                    'year' => $diary->year,
                    'poster_path' => $posterUrl,
                    'watched_at' => $diary->watched_at,
                    'note' => $diary->note,
                    'review_id' => $diary->review_id,
                    'rating' => $diary->rating,
                    'review_content' => $diary->review_content,
                    'is_liked' => (bool)$diary->is_liked,
                    'type' => $diary->type,  // 'review' or 'log'
                    'created_at' => $diary->created_at
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
     * Get user reviews list
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
                    'reviews.is_liked',
                    'reviews.watched_at',
                    'reviews.title as review_title',
                    'reviews.content',
                    'reviews.is_spoiler',
                    'reviews.created_at'
                )
                ->orderBy('reviews.created_at', 'desc')
                ->get();

            // Convert is_spoiler and is_liked to boolean
            $reviews = $reviews->map(function($review) {
                $review->is_spoiler = (bool)$review->is_spoiler;
                $review->is_liked = (bool)$review->is_liked;
                return $review;
            });

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
     * Get review detail
     */
    public function getReviewDetail($userId, $reviewId)
    {
        try {
            $review = DB::table('reviews')
                ->join('movies', 'reviews.film_id', '=', 'movies.id')
                ->join('users', 'reviews.user_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->leftJoin('movie_media as poster', function($join) {
                    $join->on('movies.id', '=', 'poster.movie_id')
                         ->where('poster.media_type', '=', 'poster')
                         ->where('poster.is_default', '=', 1);
                })
                ->leftJoin('movie_media as backdrop', function($join) {
                    $join->on('movies.id', '=', 'backdrop.movie_id')
                         ->where('backdrop.media_type', '=', 'backdrop')
                         ->where('backdrop.is_default', '=', 1);
                })
                ->where('reviews.id', $reviewId)
                ->where('reviews.status', 'published')
                ->select(
                    'reviews.id as review_id',
                    'reviews.user_id',
                    'reviews.film_id as movie_id',
                    'reviews.rating',
                    'reviews.is_liked as snapshot_is_liked',  // Snapshot for display next to stars
                    'reviews.watched_at',
                    'reviews.content as review_text',
                    'reviews.created_at',
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'poster.media_path as poster_path',
                    'backdrop.media_path as backdrop_path',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo',
                    DB::raw('(SELECT COUNT(*) FROM review_likes WHERE review_likes.review_id = reviews.id) as like_count'),
                    DB::raw('(SELECT COUNT(*) FROM review_comments WHERE review_comments.review_id = reviews.id AND review_comments.status = "published") as comment_count')
                )
                ->first();

            if (!$review) {
                return response()->json([
                    'success' => false,
                    'message' => 'Review not found'
                ], 404);
            }

            // Cast snapshot_is_liked to boolean
            $review->snapshot_is_liked = (bool)$review->snapshot_is_liked;
            
            // Check current user's like status from review_likes table
            $currentUserLiked = DB::table('review_likes')
                ->where('review_id', $reviewId)
                ->where('user_id', $userId)
                ->exists();
            
            $review->is_liked = $currentUserLiked;  // Current like status for like button

            return response()->json([
                'success' => true,
                'data' => $review
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch review detail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get diary log detail (for entries without review)
     */
    public function getDiaryDetail($userId, $diaryId)
    {
        // Log for debugging
        \Log::info("getDiaryDetail called", [
            'userId' => $userId,
            'diaryId' => $diaryId
        ]);
        
        try {
            $diary = DB::table('diaries')
                ->join('movies', 'diaries.film_id', '=', 'movies.id')
                ->join('users', 'diaries.user_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->leftJoin('reviews', 'diaries.review_id', '=', 'reviews.id')
                ->leftJoin('movie_media as poster', function($join) {
                    $join->on('movies.id', '=', 'poster.movie_id')
                         ->where('poster.media_type', '=', 'poster')
                         ->where('poster.is_default', '=', 1);
                })
                ->leftJoin('movie_media as backdrop', function($join) {
                    $join->on('movies.id', '=', 'backdrop.movie_id')
                         ->where('backdrop.media_type', '=', 'backdrop')
                         ->where('backdrop.is_default', '=', 1);
                })
                ->where('diaries.id', $diaryId)
                ->where('diaries.user_id', $userId)
                ->select(
                    'diaries.id as diary_id',
                    DB::raw('COALESCE(diaries.review_id, 0) as review_id'),
                    'diaries.user_id',
                    'diaries.film_id as movie_id',
                    DB::raw('COALESCE(reviews.rating, diaries.rating) as rating'),  // Prioritize review rating, fallback to diary rating
                    DB::raw('COALESCE(reviews.is_liked, diaries.is_liked) as is_liked'),  // Prioritize review is_liked, fallback to diary is_liked
                    DB::raw('COALESCE(reviews.content, NULL) as review_text'),
                    DB::raw('COALESCE(reviews.watched_at, diaries.watched_at) as watched_at'),  // Prioritize review watched_at
                    'diaries.created_at',
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'poster.media_path as poster_path',
                    'backdrop.media_path as backdrop_path',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo'
                )
                ->first();

            if (!$diary) {
                \Log::warning("Diary entry not found", [
                    'userId' => $userId,
                    'diaryId' => $diaryId
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Diary entry not found'
                ], 404);
            }

            \Log::info("Diary entry found", ['diary' => $diary]);

            // Cast is_liked to boolean
            $diary->is_liked = (bool)$diary->is_liked;

            return response()->json([
                'success' => true,
                'data' => $diary
            ]);
        } catch (\Exception $e) {
            \Log::error("Error in getDiaryDetail", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch diary detail: ' . $e->getMessage()
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
                    'movie_media.media_path',
                    'movie_likes.created_at as liked_at'
                )
                ->orderBy('movie_likes.created_at', 'desc')
                ->get();

            // Build full poster URLs and get average rating
            $likesData = $likes->map(function($like) {
                $posterUrl = null;
                if ($like->media_path) {
                    if (!str_starts_with($like->media_path, 'http')) {
                        $posterUrl = "http://10.0.2.2:8000/storage/{$like->media_path}";
                    } else {
                        $posterUrl = $like->media_path;
                    }
                }
                
                // Get average rating for this movie
                $averageRating = DB::table('ratings')
                    ->where('film_id', $like->id)
                    ->avg('rating') ?? 0;
                
                return [
                    'id' => $like->id,
                    'title' => $like->title,
                    'year' => $like->year,
                    'poster_path' => $posterUrl,
                    'rating' => round($averageRating, 1),
                    'liked_at' => $like->liked_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $likesData
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
                        'is_watched' => true,
                        'created_at' => $rating->created_at,
                        'updated_at' => $rating->updated_at
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
    
    /**
     * Toggle like for a movie (like/unlike)
     */
    public function toggleLike($userId, $movieId)
    {
        try {
            // Check if already liked
            $existingLike = DB::table('movie_likes')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->first();
            
            if ($existingLike) {
                // Unlike - delete the like
                DB::table('movie_likes')
                    ->where('user_id', $userId)
                    ->where('film_id', $movieId)
                    ->delete();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_liked' => false
                    ],
                    'message' => 'Movie unliked successfully'
                ]);
            } else {
                // Like - insert new like
                DB::table('movie_likes')->insert([
                    'user_id' => $userId,
                    'film_id' => $movieId,
                    'created_at' => now()
                ]);
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_liked' => true
                    ],
                    'message' => 'Movie liked successfully'
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle like: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if user has liked a movie
     */
    public function checkLike($userId, $movieId)
    {
        try {
            $like = DB::table('movie_likes')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'is_liked' => $like !== null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check like status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Toggle watchlist (add or remove from watchlist)
     */
    public function toggleWatchlist($userId, $movieId)
    {
        try {
            // Check if already in watchlist
            $existingWatchlist = DB::table('watchlists')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->first();
            
            if ($existingWatchlist) {
                // Remove from watchlist
                DB::table('watchlists')
                    ->where('user_id', $userId)
                    ->where('film_id', $movieId)
                    ->delete();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_in_watchlist' => false
                    ],
                    'message' => 'Removed from watchlist'
                ]);
            } else {
                // Add to watchlist
                DB::table('watchlists')->insert([
                    'user_id' => $userId,
                    'film_id' => $movieId,
                    'created_at' => now()
                ]);
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_in_watchlist' => true
                    ],
                    'message' => 'Added to watchlist'
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle watchlist: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if movie is in user's watchlist
     */
    public function checkWatchlist($userId, $movieId)
    {
        try {
            $watchlist = DB::table('watchlists')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'is_in_watchlist' => $watchlist !== null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check watchlist status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Save a review for a movie
     */
    public function saveReview(Request $request, $userId, $movieId)
    {
        try {
            $reviewText = $request->input('review');
            $rating = $request->input('rating', 0);
            $containsSpoilers = $request->input('contains_spoilers', false);
            $watchedAt = $request->input('watched_at', now()->format('Y-m-d'));
            
            // Check if user has liked this movie (from movie_likes table)
            $isLiked = DB::table('movie_likes')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->exists();
            
            $reviewId = null;
            
            // If review text is provided, save to reviews table
            if (!empty($reviewText)) {
                // Check if review already exists
                $existingReview = DB::table('reviews')
                    ->where('user_id', $userId)
                    ->where('film_id', $movieId)
                    ->first();
                
                if ($existingReview) {
                    // Update existing review
                    DB::table('reviews')
                        ->where('user_id', $userId)
                        ->where('film_id', $movieId)
                        ->update([
                            'content' => $reviewText,
                            'rating' => $rating,
                            'is_spoiler' => $containsSpoilers ? 1 : 0,
                            'is_liked' => $isLiked,  // Snapshot of like status
                            'watched_at' => $watchedAt,
                            'updated_at' => now()
                        ]);
                    $reviewId = $existingReview->id;
                } else {
                    // Create new review
                    $reviewId = DB::table('reviews')->insertGetId([
                        'user_id' => $userId,
                        'film_id' => $movieId,
                        'content' => $reviewText,
                        'rating' => $rating,
                        'is_spoiler' => $containsSpoilers ? 1 : 0,
                        'is_liked' => $isLiked,  // Snapshot of like status
                        'watched_at' => $watchedAt,
                        'status' => 'published',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
            
            // Always save to diary (for both review and log)
            $existingDiary = DB::table('diaries')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->first();
            
            $diaryNote = !empty($reviewText) ? "Review: $reviewText" : "Watched this film";
            
            if ($existingDiary) {
                // Update existing diary
                $updateData = [
                    'watched_at' => $watchedAt,
                    'rating' => $rating,  // Save rating snapshot
                    'is_liked' => $isLiked,  // Snapshot of like status
                    'note' => $diaryNote,
                    'updated_at' => now()
                ];
                
                // Set review_id if a review was created/updated
                if ($reviewId) {
                    $updateData['review_id'] = $reviewId;
                }
                
                DB::table('diaries')
                    ->where('user_id', $userId)
                    ->where('film_id', $movieId)
                    ->update($updateData);
            } else {
                // Create new diary entry
                $insertData = [
                    'user_id' => $userId,
                    'film_id' => $movieId,
                    'watched_at' => $watchedAt,
                    'rating' => $rating,  // Save rating snapshot
                    'is_liked' => $isLiked,  // Snapshot of like status
                    'note' => $diaryNote,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
                
                // Set review_id if a review was created
                if ($reviewId) {
                    $insertData['review_id'] = $reviewId;
                }
                
                DB::table('diaries')->insert($insertData);
            }
            
            $message = !empty($reviewText) ? 'Review saved successfully' : 'Log saved successfully';
            
            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateReview(Request $request, $userId, $reviewId)
    {
        try {
            // Check if review exists and belongs to user
            $review = DB::table('reviews')
                ->where('id', $reviewId)
                ->where('user_id', $userId)
                ->first();
            
            if (!$review) {
                return response()->json([
                    'success' => false,
                    'message' => 'Review not found or unauthorized'
                ], 404);
            }
            
            $reviewText = $request->input('review');
            $rating = $request->input('rating', $review->rating);
            $containsSpoilers = $request->input('contains_spoilers', false);
            $watchedAt = $request->input('watched_at');
            
            // Check current like status from movie_likes
            $isLiked = DB::table('movie_likes')
                ->where('user_id', $userId)
                ->where('film_id', $review->film_id)
                ->exists();
            
            // Update review
            DB::table('reviews')
                ->where('id', $reviewId)
                ->update([
                    'content' => $reviewText,
                    'rating' => $rating,
                    'is_spoiler' => $containsSpoilers ? 1 : 0,
                    'is_liked' => $isLiked,  // Update snapshot
                    'watched_at' => $watchedAt,
                    'updated_at' => now()
                ]);
            
            // Update diary entry as well
            $diaryUpdateData = [
                'note' => "Review: $reviewText",
                'rating' => $rating,  // Update rating snapshot
                'is_liked' => $isLiked,  // Update snapshot
                'updated_at' => now()
            ];
            
            if ($watchedAt) {
                $diaryUpdateData['watched_at'] = $watchedAt;
            }
            
            DB::table('diaries')
                ->where('user_id', $userId)
                ->where('film_id', $review->film_id)
                ->update($diaryUpdateData);
            
            return response()->json([
                'success' => true,
                'message' => 'Review updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteReview(Request $request, $userId, $reviewId)
    {
        try {
            // Check if review exists and belongs to user
            $review = DB::table('reviews')
                ->where('id', $reviewId)
                ->where('user_id', $userId)
                ->first();
            
            if (!$review) {
                return response()->json([
                    'success' => false,
                    'message' => 'Review not found or unauthorized'
                ], 404);
            }
            
            // Delete review
            DB::table('reviews')
                ->where('id', $reviewId)
                ->delete();
            
            // Delete diary entry if exists
            DB::table('diaries')
                ->where('user_id', $userId)
                ->where('film_id', $review->film_id)
                ->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Review deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteDiary(Request $request, $userId, $diaryId)
    {
        try {
            // Check if diary exists and belongs to user
            $diary = DB::table('diaries')
                ->where('id', $diaryId)
                ->where('user_id', $userId)
                ->first();
            
            if (!$diary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Diary entry not found or unauthorized'
                ], 404);
            }
            
            // Delete diary entry
            DB::table('diaries')
                ->where('id', $diaryId)
                ->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Diary entry deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comments for a review
     */
    public function getReviewComments($reviewId)
    {
        try {
            $comments = DB::table('review_comments')
                ->join('users', 'review_comments.user_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->where('review_comments.review_id', $reviewId)
                ->where('review_comments.status', 'published')
                ->whereNull('review_comments.parent_id')  // Only top-level comments for now
                ->select(
                    'review_comments.id',
                    'review_comments.review_id',
                    'review_comments.user_id',
                    'review_comments.content',
                    'review_comments.created_at',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo'
                )
                ->orderBy('review_comments.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $comments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch comments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a comment to a review
     */
    public function addReviewComment(Request $request, $userId, $reviewId)
    {
        try {
            $commentText = $request->input('comment');
            
            if (empty($commentText)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Comment text is required'
                ], 400);
            }
            
            // Insert comment
            $commentId = DB::table('review_comments')->insertGetId([
                'review_id' => $reviewId,
                'user_id' => $userId,
                'content' => $commentText,
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            // Get the created comment with user info
            $comment = DB::table('review_comments')
                ->join('users', 'review_comments.user_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->where('review_comments.id', $commentId)
                ->select(
                    'review_comments.id',
                    'review_comments.review_id',
                    'review_comments.user_id',
                    'review_comments.content',
                    'review_comments.created_at',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo'
                )
                ->first();
            
            return response()->json([
                'success' => true,
                'message' => 'Comment added successfully',
                'data' => $comment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add comment: ' . $e->getMessage()
            ], 500);
        }
    }
}

