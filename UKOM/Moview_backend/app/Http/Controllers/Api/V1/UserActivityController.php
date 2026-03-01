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
                ->leftJoin('reviews', function($join) {
                    $join->on('diaries.review_id', '=', 'reviews.id');
                })
                ->where('diaries.user_id', $userId)
                ->select(
                    'diaries.id as diary_id',
                    'diaries.film_id',
                    'diaries.watched_at',
                    'diaries.note',
                    'diaries.is_rewatched',
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
                    'is_rewatched' => (bool)$diary->is_rewatched,
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
     * Get watch count (diary count) for specific movie
     */
    public function getWatchCount($userId, $movieId)
    {
        try {
            $count = DB::table('diaries')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'watch_count' => $count
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch watch count: ' . $e->getMessage()
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
                ->leftJoin('diaries', function($join) use ($userId) {
                    $join->on('reviews.film_id', '=', 'diaries.film_id')
                         ->on('reviews.id', '=', 'diaries.review_id')
                         ->where('diaries.user_id', '=', $userId);
                })
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
                    'reviews.created_at',
                    DB::raw('COALESCE(diaries.is_rewatched, 0) as is_rewatched')
                )
                ->orderBy('reviews.created_at', 'desc')
                ->get();

            // Convert is_spoiler, is_liked, and is_rewatched to boolean
            $reviews = $reviews->map(function($review) {
                $review->is_spoiler = (bool)$review->is_spoiler;
                $review->is_liked = (bool)$review->is_liked;
                $review->is_rewatched = (bool)$review->is_rewatched;
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
                ->whereIn('reviews.status', ['published', 'flagged'])  // Allow flagged reviews to be viewed
                ->select(
                    'reviews.id as review_id',
                    'reviews.user_id',
                    'reviews.film_id as movie_id',
                    'reviews.rating',
                    'reviews.is_liked as snapshot_is_liked',  // Snapshot for display next to stars
                    'reviews.is_rewatched',  // Whether this review was written during rewatch
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

            // Cast snapshot_is_liked and is_rewatched to boolean
            $review->snapshot_is_liked = (bool)$review->snapshot_is_liked;
            $review->is_rewatched = (bool)$review->is_rewatched;
            
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
                ->leftJoin('ratings', function($join) use ($userId) {
                    $join->on('movies.id', '=', 'ratings.film_id')
                         ->where('ratings.user_id', '=', $userId);
                })
                ->where('movie_likes.user_id', $userId)
                ->select(
                    'movies.id',
                    'movies.title',
                    'movies.release_year as year',
                    'movie_media.media_path',
                    'ratings.rating as user_rating',
                    'movie_likes.created_at as liked_at'
                )
                ->orderBy('movie_likes.created_at', 'desc')
                ->get();

            // Build full poster URLs
            $likesData = $likes->map(function($like) {
                $posterUrl = null;
                if ($like->media_path) {
                    if (!str_starts_with($like->media_path, 'http')) {
                        $posterUrl = "http://10.0.2.2:8000/storage/{$like->media_path}";
                    } else {
                        $posterUrl = $like->media_path;
                    }
                }
                
                return [
                    'id' => $like->id,
                    'title' => $like->title,
                    'year' => $like->year,
                    'poster_path' => $posterUrl,
                    'rating' => $like->user_rating ?? 0,
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

            // Build full URLs for profile photos
            $followersWithUrls = $followers->map(function($follower) {
                $profilePhotoUrl = null;
                if ($follower->profile_photo) {
                    if (!str_starts_with($follower->profile_photo, 'http')) {
                        $profilePhotoUrl = "http://10.0.2.2:8000/storage/{$follower->profile_photo}";
                    } else {
                        $profilePhotoUrl = $follower->profile_photo;
                    }
                }
                
                return [
                    'id' => $follower->id,
                    'username' => $follower->username,
                    'display_name' => $follower->display_name,
                    'profile_photo' => $profilePhotoUrl,
                    'bio' => $follower->bio,
                    'followed_at' => $follower->followed_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $followersWithUrls
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

            // Build full URLs for profile photos
            $followingWithUrls = $following->map(function($user) {
                $profilePhotoUrl = null;
                if ($user->profile_photo) {
                    if (!str_starts_with($user->profile_photo, 'http')) {
                        $profilePhotoUrl = "http://10.0.2.2:8000/storage/{$user->profile_photo}";
                    } else {
                        $profilePhotoUrl = $user->profile_photo;
                    }
                }
                
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'display_name' => $user->display_name,
                    'profile_photo' => $profilePhotoUrl,
                    'bio' => $user->bio,
                    'followed_at' => $user->followed_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $followingWithUrls
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
            $isRewatch = $request->input('is_rewatch', false); // New parameter to indicate rewatch
            
            // Check if user has liked this movie (from movie_likes table)
            $isLiked = DB::table('movie_likes')
                ->where('user_id', $userId)
                ->where('film_id', $movieId)
                ->exists();
            
            $reviewId = null;
            
            // Handle review creation/update based on review text and rewatch status
            if (!empty($reviewText)) {
                if ($isRewatch) {
                    // REWATCH MODE: Always create NEW review entry
                    // Each rewatch with review text gets its own review entry in reviews table
                    $reviewId = DB::table('reviews')->insertGetId([
                        'user_id' => $userId,
                        'film_id' => $movieId,
                        'content' => $reviewText,
                        'rating' => $rating,
                        'is_spoiler' => $containsSpoilers ? 1 : 0,
                        'is_liked' => $isLiked,
                        'is_rewatched' => 1,  // Mark as rewatch
                        'watched_at' => $watchedAt,
                        'status' => 'published',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    \Log::info("Created NEW review id: $reviewId for REWATCH (is_rewatched=1)");
                } else {
                    // NOT REWATCH: Check if review exists for edit mode
                    $existingReview = DB::table('reviews')
                        ->where('user_id', $userId)
                        ->where('film_id', $movieId)
                        ->orderBy('created_at', 'desc')
                        ->first();
                    
                    if ($existingReview) {
                        // Edit mode: update most recent review
                        DB::table('reviews')
                            ->where('id', $existingReview->id)
                            ->update([
                                'content' => $reviewText,
                                'rating' => $rating,
                                'is_spoiler' => $containsSpoilers ? 1 : 0,
                                'is_liked' => $isLiked,
                                'watched_at' => $watchedAt,
                                'updated_at' => now()
                            ]);
                        $reviewId = $existingReview->id;
                        \Log::info("Updated existing review id: $reviewId (edit mode)");
                    } else {
                        // First review: create new
                        $reviewId = DB::table('reviews')->insertGetId([
                            'user_id' => $userId,
                            'film_id' => $movieId,
                            'content' => $reviewText,
                            'rating' => $rating,
                            'is_spoiler' => $containsSpoilers ? 1 : 0,
                            'is_liked' => $isLiked,
                            'is_rewatched' => 0,  // First watch
                            'watched_at' => $watchedAt,
                            'status' => 'published',
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                        \Log::info("Created FIRST review id: $reviewId (is_rewatched=0)");
                    }
                }
            } else {
                // No review text provided, get most recent review if exists for linking
                $existingReview = DB::table('reviews')
                    ->where('user_id', $userId)
                    ->where('film_id', $movieId)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                if ($existingReview) {
                    $reviewId = $existingReview->id;
                    \Log::info("Linking to most recent review id: $reviewId (no new review text)");
                }
            }
            
            // Always save to diary (for both review and log)
            // ALWAYS create NEW diary entry for watch/rewatch tracking - never update
            // Each diary entry represents one watch with its own note
            $diaryNote = !empty($reviewText) ? $reviewText : "Watched this film";
            
            $insertData = [
                'user_id' => $userId,
                'film_id' => $movieId,
                'watched_at' => $watchedAt,
                'rating' => $rating,  // Save rating snapshot
                'is_liked' => $isLiked,  // Snapshot of like status
                'note' => $diaryNote,  // Store review/note text here for this specific watch
                'is_rewatched' => $isRewatch ? 1 : 0,  // Mark if this is a rewatch
                'created_at' => now(),
                'updated_at' => now()
            ];
            
            // Link to review if review exists (either created or existing)
            if ($reviewId) {
                $insertData['review_id'] = $reviewId;
            }
            
            // Always insert new diary entry (for rewatch tracking)
            DB::table('diaries')->insert($insertData);
            \Log::info("Created diary entry for user $userId, film $movieId, is_rewatched: " . ($isRewatch ? 'true' : 'false'));
            
            $message = $isRewatch 
                ? 'Rewatch logged successfully' 
                : (!empty($reviewText) ? 'Review saved successfully' : 'Log saved successfully');
            
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
     * Flag a review as inappropriate
     */
    public function flagReview(Request $request, $userId, $reviewId)
    {
        try {
            // Check if review exists
            $review = DB::table('reviews')
                ->where('id', $reviewId)
                ->first();
            
            if (!$review) {
                return response()->json([
                    'success' => false,
                    'message' => 'Review not found'
                ], 404);
            }
            
            // Check if user is not flagging their own review
            if ($review->user_id == $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot flag your own review'
                ], 403);
            }
            
            // Update review status to flagged
            DB::table('reviews')
                ->where('id', $reviewId)
                ->update(['status' => 'flagged']);
            
            return response()->json([
                'success' => true,
                'message' => 'Review flagged successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to flag review: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comments for a review
     */
    public function getReviewComments($reviewId)
    {
        try {
            // Get all comments for this review (excluding hidden ones)
            $allComments = DB::table('review_comments')
                ->join('users', 'review_comments.user_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->where('review_comments.review_id', $reviewId)
                ->whereIn('review_comments.status', ['published', 'deleted', 'flagged'])
                ->select(
                    'review_comments.id',
                    'review_comments.review_id',
                    'review_comments.user_id',
                    'review_comments.content',
                    'review_comments.parent_id',
                    'review_comments.status',
                    'review_comments.created_at',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo'
                )
                ->orderBy('review_comments.created_at', 'desc')
                ->get();

            // Separate top-level comments and replies
            $topLevelComments = [];
            $repliesByParentId = [];

            foreach ($allComments as $comment) {
                // Replace content with "Comment removed" if deleted
                if ($comment->status === 'deleted') {
                    $comment->content = 'Comment removed';
                }
                
                if ($comment->parent_id === null) {
                    $comment->replies = [];
                    $topLevelComments[] = $comment;
                } else {
                    if (!isset($repliesByParentId[$comment->parent_id])) {
                        $repliesByParentId[$comment->parent_id] = [];
                    }
                    $repliesByParentId[$comment->parent_id][] = $comment;
                }
            }

            // Attach replies to their parent comments
            foreach ($topLevelComments as $comment) {
                if (isset($repliesByParentId[$comment->id])) {
                    $comment->replies = $repliesByParentId[$comment->id];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $topLevelComments
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
            $parentId = $request->input('parent_id');  // Optional parent_id for replies
            
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
                'parent_id' => $parentId,  // Will be null for top-level comments
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
            
            // Create notification
            $review = DB::table('reviews')
                ->join('movies', 'reviews.film_id', '=', 'movies.id')
                ->where('reviews.id', $reviewId)
                ->select('reviews.user_id as review_user_id', 'reviews.film_id', 'movies.title as movie_title')
                ->first();
            
            if ($review) {
                $commenterName = $comment->display_name ?? $comment->username;
                
                if ($parentId) {
                    // This is a reply - notify the parent comment author
                    $parentComment = DB::table('review_comments')
                        ->where('id', $parentId)
                        ->first();
                    
                    // Insert to user_activities for reply
                    DB::table('user_activities')->insert([
                        'user_id' => $userId,
                        'type' => 'reply_comment',
                        'film_id' => $review->film_id,
                        'meta' => json_encode([
                            'review_id' => $reviewId,
                            'parent_comment_id' => $parentId,
                            'comment_id' => $commentId,
                            'parent_comment_owner_id' => $parentComment->user_id ?? null
                        ]),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    if ($parentComment && $parentComment->user_id != $userId) {
                        NotificationController::createNotification(
                            $parentComment->user_id,
                            $userId,
                            'reply_comment',
                            "{$commenterName} replied to your comment on {$review->movie_title}",
                            $review->film_id,
                            $commentId
                        );
                    }
                } else {
                    // This is a comment on the review - notify the review author
                    
                    // Insert to user_activities for comment
                    DB::table('user_activities')->insert([
                        'user_id' => $userId,
                        'type' => 'comment_review',
                        'film_id' => $review->film_id,
                        'meta' => json_encode([
                            'review_id' => $reviewId,
                            'comment_id' => $commentId,
                            'review_owner_id' => $review->review_user_id
                        ]),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    if ($review->review_user_id != $userId) {
                        NotificationController::createNotification(
                            $review->review_user_id,
                            $userId,
                            'comment_review',
                            "{$commenterName} commented on your review of {$review->movie_title}",
                            $review->film_id,
                            $commentId
                        );
                    }
                }
            }
            
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
    
    public function deleteReviewComment($userId, $commentId)
    {
        try {
            // Check if comment exists and belongs to user
            $comment = DB::table('review_comments')
                ->where('id', $commentId)
                ->where('user_id', $userId)
                ->first();
            
            if (!$comment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Comment not found or you do not have permission to delete it'
                ], 404);
            }
            
            // Delete replies first (if this is a parent comment)
            DB::table('review_comments')
                ->where('parent_id', $commentId)
                ->delete();
            
            // Actually delete the comment (hard delete)
            DB::table('review_comments')
                ->where('id', $commentId)
                ->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Flag a comment as inappropriate
     */
    public function flagReviewComment($userId, $commentId)
    {
        try {
            // Check if comment exists
            $comment = DB::table('review_comments')
                ->where('id', $commentId)
                ->first();
            
            if (!$comment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Comment not found'
                ], 404);
            }
            
            // User cannot flag their own comment
            if ($comment->user_id == $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot flag your own comment'
                ], 400);
            }
            
            // Mark comment as flagged
            DB::table('review_comments')
                ->where('id', $commentId)
                ->update(['status' => 'flagged', 'updated_at' => now()]);
            
            // Create notification for admin
            // You can implement admin notification logic here
            
            return response()->json([
                'success' => true,
                'message' => 'Comment has been flagged for review'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to flag comment: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function followUser($userId, $targetUserId)
    {
        try {
            // Check if already following
            $existing = DB::table('followers')
                ->where('user_id', $targetUserId)
                ->where('follower_id', $userId)
                ->first();
            
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Already following this user'
                ], 400);
            }
            
            // Insert follow relationship
            // user_id = target being followed, follower_id = current user doing the follow
            DB::table('followers')->insert([
                'user_id' => $targetUserId,
                'follower_id' => $userId,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            // Insert to user_activities
            DB::table('user_activities')->insert([
                'user_id' => $userId,
                'type' => 'follow',
                'film_id' => null,
                'meta' => json_encode([
                    'followed_user_id' => $targetUserId
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            // Create notification
            $followerName = DB::table('user_profiles')
                ->join('users', 'user_profiles.user_id', '=', 'users.id')
                ->where('user_profiles.user_id', $userId)
                ->value('user_profiles.display_name') ?? DB::table('users')->where('id', $userId)->value('username');
            
            NotificationController::createNotification(
                $targetUserId,
                $userId,
                'follow',
                "{$followerName} followed you"
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Successfully followed user'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to follow user: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function unfollowUser($userId, $targetUserId)
    {
        try {
            $deleted = DB::table('followers')
                ->where('user_id', $targetUserId)
                ->where('follower_id', $userId)
                ->delete();
            
            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Successfully unfollowed user'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Not following this user'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unfollow user: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function isFollowing($userId, $targetUserId)
    {
        try {
            \Log::info("=== isFollowing API Called ===", [
                'currentUserId' => $userId,
                'targetUserId' => $targetUserId
            ]);
            
            $isFollowing = DB::table('followers')
                ->where('user_id', $targetUserId)
                ->where('follower_id', $userId)
                ->exists();
            
            \Log::info("isFollowing result", [
                'isFollowing' => $isFollowing,
                'query' => "user_id=$targetUserId AND follower_id=$userId"
            ]);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'isFollowing' => $isFollowing
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error("isFollowing error", [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to check follow status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Toggle review like (like or unlike a review)
     */
    public function toggleReviewLike($userId, $reviewId)
    {
        try {
            // Check if already liked
            $existingLike = DB::table('review_likes')
                ->where('user_id', $userId)
                ->where('review_id', $reviewId)
                ->first();
            
            if ($existingLike) {
                // Unlike - remove from review_likes
                DB::table('review_likes')
                    ->where('user_id', $userId)
                    ->where('review_id', $reviewId)
                    ->delete();
                
                // Get updated like count
                $likeCount = DB::table('review_likes')
                    ->where('review_id', $reviewId)
                    ->count();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_liked' => false,
                        'like_count' => $likeCount
                    ]
                ]);
            } else {
                // Like - add to review_likes
                DB::table('review_likes')->insert([
                    'user_id' => $userId,
                    'review_id' => $reviewId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                
                // Get updated like count
                $likeCount = DB::table('review_likes')
                    ->where('review_id', $reviewId)
                    ->count();
                
                // Create notification
                $review = DB::table('reviews')
                    ->join('movies', 'reviews.film_id', '=', 'movies.id')
                    ->where('reviews.id', $reviewId)
                    ->select('reviews.user_id as review_user_id', 'reviews.rating', 'reviews.film_id', 'movies.title as movie_title')
                    ->first();
                
                if ($review) {
                    // Insert to user_activities
                    DB::table('user_activities')->insert([
                        'user_id' => $userId,
                        'type' => 'like_review',
                        'film_id' => $review->film_id,
                        'meta' => json_encode([
                            'review_id' => $reviewId,
                            'review_owner_id' => $review->review_user_id
                        ]),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    if ($review->review_user_id != $userId) {
                        $likerName = DB::table('user_profiles')
                            ->join('users', 'user_profiles.user_id', '=', 'users.id')
                            ->where('user_profiles.user_id', $userId)
                            ->value('user_profiles.display_name') ?? DB::table('users')->where('id', $userId)->value('username');
                        
                        $stars = str_repeat('★', (int)$review->rating);
                        
                        NotificationController::createNotification(
                            $review->review_user_id,
                            $userId,
                            'like_review',
                            "{$likerName} liked your {$stars} review of {$review->movie_title}",
                            $review->film_id,
                            $reviewId
                        );
                    }
                }
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_liked' => true,
                        'like_count' => $likeCount
                    ]
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle review like: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if user has liked a review
     */
    public function checkReviewLike($userId, $reviewId)
    {
        try {
            $like = DB::table('review_likes')
                ->where('user_id', $userId)
                ->where('review_id', $reviewId)
                ->first();
            
            $likeCount = DB::table('review_likes')
                ->where('review_id', $reviewId)
                ->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'is_liked' => $like !== null,
                    'like_count' => $likeCount
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check review like status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get reviews that user has liked for a specific movie
     */
    public function getLikedReviewsForMovie($userId, $movieId)
    {
        try {
            $likedReviews = DB::table('review_likes')
                ->join('reviews', 'review_likes.review_id', '=', 'reviews.id')
                ->join('users', 'reviews.user_id', '=', 'users.id')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->where('review_likes.user_id', $userId)
                ->where('reviews.film_id', $movieId)
                ->where('reviews.user_id', '!=', $userId) // Exclude own reviews
                ->select(
                    'reviews.id as review_id',
                    'reviews.user_id',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo',
                    'reviews.rating'
                )
                ->get();
            
            // Transform profile photo URLs
            $likedReviews = $likedReviews->map(function($review) {
                if ($review->profile_photo) {
                    $review->profile_photo = url('storage/' . $review->profile_photo);
                }
                return $review;
            });
            
            return response()->json([
                'success' => true,
                'data' => $likedReviews
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get liked reviews: ' . $e->getMessage()
            ], 500);
        }
    }
}

