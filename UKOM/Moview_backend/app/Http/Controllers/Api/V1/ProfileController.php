<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /**
     * Get user profile
     * 
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProfile($userId)
    {
        try {
            // Get user basic info
            $user = DB::table('users')
                ->where('id', $userId)
                ->first(['id', 'username', 'email', 'role', 'joined_at']);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Get user profile
            $profile = DB::table('user_profiles')
                ->where('user_id', $userId)
                ->first();

            // Get favorite films (positions 1-4)
            $favorites = DB::table('user_favorite_films')
                ->where('user_id', $userId)
                ->whereIn('position', [1, 2, 3, 4])
                ->orderBy('position')
                ->get(['film_id', 'position']);

            $favoriteMovies = [];
            foreach ($favorites as $fav) {
                $movie = DB::table('movies')
                    ->where('id', $fav->film_id)
                    ->first(['id', 'title', 'release_year']);
                
                if ($movie) {
                    // Get poster from movie_media
                    $poster = DB::table('movie_media')
                        ->where('movie_id', $movie->id)
                        ->where('media_type', 'poster')
                        ->where('is_default', 1)
                        ->first(['media_path']);

                    // Build full URL for poster
                    $posterUrl = null;
                    if ($poster && $poster->media_path) {
                        if (!str_starts_with($poster->media_path, 'http')) {
                            $posterUrl = "http://10.0.2.2:8000/storage/{$poster->media_path}";
                        } else {
                            $posterUrl = $poster->media_path;
                        }
                    }

                    $favoriteMovies[] = [
                        'id' => $movie->id,
                        'title' => $movie->title,
                        'year' => $movie->release_year,
                        'poster_path' => $posterUrl,
                        'position' => $fav->position
                    ];
                }
            }

            // Get statistics
            $stats = $this->getUserStatistics($userId);

            // Build profile photo URL - use storage path for reliability
            $profilePhotoUrl = null;
            if ($profile && $profile->profile_photo) {
                // Use direct storage URL (no timestamp - let Glide handle caching)
                $profilePhotoUrl = "http://10.0.2.2:8000/storage/{$profile->profile_photo}";
            }

            // Build backdrop URL
            $backdropUrl = null;
            if ($profile && $profile->backdrop_path) {
                $backdropUrl = $profile->backdrop_path;
                if (!str_starts_with($backdropUrl, 'http')) {
                    $backdropUrl = "http://10.0.2.2:8000/storage/{$profile->backdrop_path}";
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role' => $user->role,
                        'joined_at' => $user->joined_at
                    ],
                    'profile' => [
                        'display_name' => $profile && !empty($profile->display_name) ? $profile->display_name : $user->username,
                        'profile_photo_url' => $profilePhotoUrl,
                        'backdrop_url' => $backdropUrl,
                        'backdrop_enabled' => $profile && $profile->backdrop_enabled ? true : false,
                        'bio' => $profile && !empty($profile->bio) ? $profile->bio : '',
                        'location' => $profile && !empty($profile->location) ? $profile->location : ''
                    ],
                    'favorites' => $favoriteMovies,
                    'statistics' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    private function getUserStatistics($userId)
    {
        try {
            // Count films from ratings table
            $filmsCount = DB::table('ratings')
                ->where('user_id', $userId)
                ->count();
        } catch (\Exception $e) {
            $filmsCount = 0;
        }

        try {
            // Count diary entries
            $diaryCount = DB::table('diaries')
                ->where('user_id', $userId)
                ->count();
        } catch (\Exception $e) {
            $diaryCount = 0;
        }

        try {
            // Count reviews
            $reviewsCount = DB::table('reviews')
                ->where('user_id', $userId)
                ->where('status', 'published')
                ->count();
        } catch (\Exception $e) {
            $reviewsCount = 0;
        }

        try {
            // Count watchlist
            $watchlistCount = DB::table('watchlists')
                ->where('user_id', $userId)
                ->count();
        } catch (\Exception $e) {
            $watchlistCount = 0;
        }

        try {
            // Count likes
            $likesCount = DB::table('movie_likes')
                ->where('user_id', $userId)
                ->count();
        } catch (\Exception $e) {
            $likesCount = 0;
        }

        try {
            // Count followers (people following this user)
            $followersCount = DB::table('followers')
                ->where('user_id', $userId)
                ->count();
        } catch (\Exception $e) {
            $followersCount = 0;
        }

        try {
            // Count following (people this user follows)
            $followingCount = DB::table('followers')
                ->where('follower_id', $userId)
                ->count();
        } catch (\Exception $e) {
            $followingCount = 0;
        }

        try {
            // Rating distribution (1-5 stars)
            $ratingDistribution = [];
            $totalRatings = 0;
            for ($i = 1; $i <= 5; $i++) {
                $count = DB::table('ratings')
                    ->where('user_id', $userId)
                    ->where('rating', $i)
                    ->count();
                $ratingDistribution[$i] = $count;
                $totalRatings += $count;
            }
            
            // Count watched without rating (rating = 0)
            $watchedNoRating = DB::table('ratings')
                ->where('user_id', $userId)
                ->where('rating', 0)
                ->count();
            $totalRatings += $watchedNoRating;
        } catch (\Exception $e) {
            $ratingDistribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
            $totalRatings = 0;
        }

        return [
            'films' => $filmsCount,
            'diary' => $diaryCount,
            'reviews' => $reviewsCount,
            'watchlist' => $watchlistCount,
            'likes' => $likesCount,
            'followers' => $followersCount,
            'following' => $followingCount,
            'total_ratings' => $totalRatings,
            'rating_distribution' => $ratingDistribution
        ];
    }

    /**
     * Update favorite films
     * 
     * @param Request $request
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateFavorites(Request $request, $userId)
    {
        try {
            $favorites = $request->input('favorites', []);

            // Delete existing favorites
            DB::table('user_favorite_films')
                ->where('user_id', $userId)
                ->delete();

            // Insert new favorites
            foreach ($favorites as $index => $filmId) {
                if ($filmId && $index < 4) {
                    DB::table('user_favorite_films')->insert([
                        'user_id' => $userId,
                        'film_id' => $filmId,
                        'position' => $index + 1,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Favorites updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update favorites: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user profile
     * 
     * @param Request $request
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request, $userId)
    {
        try {
            $username = $request->input('username');
            $bio = $request->input('bio');
            $location = $request->input('location');
            $backdropEnabled = $request->input('backdrop_enabled', false);

            // Update username in users table
            if ($username) {
                DB::table('users')
                    ->where('id', $userId)
                    ->update(['username' => $username]);
            }

            // Update or create user profile
            $profile = DB::table('user_profiles')
                ->where('user_id', $userId)
                ->first();

            if ($profile) {
                // Update existing profile
                $updateData = [
                    'bio' => $bio,
                    'location' => $location,
                    'backdrop_enabled' => $backdropEnabled,
                    'updated_at' => now()
                ];
                
                // Also update display_name if username is provided
                if ($username) {
                    $updateData['display_name'] = $username;
                }
                
                DB::table('user_profiles')
                    ->where('user_id', $userId)
                    ->update($updateData);
            } else {
                // Create new profile
                DB::table('user_profiles')->insert([
                    'user_id' => $userId,
                    'bio' => $bio,
                    'location' => $location,
                    'backdrop_enabled' => $backdropEnabled,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // If backdrop enabled, get first favorite film's backdrop
            if ($backdropEnabled) {
                $firstFavorite = DB::table('user_favorite_films')
                    ->where('user_id', $userId)
                    ->orderBy('position')
                    ->first();

                if ($firstFavorite) {
                    // Get backdrop from movie_media
                    $backdrop = DB::table('movie_media')
                        ->where('movie_id', $firstFavorite->film_id)
                        ->where('media_type', 'backdrop')
                        ->where('is_default', 1)
                        ->first(['media_path']);

                    if ($backdrop) {
                        DB::table('user_profiles')
                            ->where('user_id', $userId)
                            ->update([
                                'backdrop_path' => $backdrop->media_path,
                                'updated_at' => now()
                            ]);
                    }
                }
            } else {
                // Clear backdrop if disabled
                DB::table('user_profiles')
                    ->where('user_id', $userId)
                    ->update([
                        'backdrop_path' => null,
                        'updated_at' => now()
                    ]);
            }

            // Get the updated profile photo URL
            $updatedProfile = DB::table('user_profiles')
                ->where('user_id', $userId)
                ->first(['profile_photo']);
            
            $profilePhotoUrl = null;
            if ($updatedProfile && $updatedProfile->profile_photo) {
                $profilePhotoUrl = "http://10.0.2.2:8000/storage/{$updatedProfile->profile_photo}";
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'profile_photo_url' => $profilePhotoUrl
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload profile photo
     * 
     * @param Request $request
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadProfilePhoto(Request $request, $userId)
    {
        try {
            if (!$request->hasFile('photo')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No photo uploaded'
                ], 400);
            }

            $file = $request->file('photo');
            
            // Validate file
            if (!$file->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid file'
                ], 400);
            }

            // Generate unique filename
            $filename = 'profile_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Store file in storage/app/public/profiles
            $path = $file->storeAs('profiles', $filename, 'public');

            // Update or create user profile
            $profile = DB::table('user_profiles')
                ->where('user_id', $userId)
                ->first();

            if ($profile) {
                // Delete old photo if exists
                if ($profile->profile_photo && file_exists(storage_path('app/public/' . $profile->profile_photo))) {
                    unlink(storage_path('app/public/' . $profile->profile_photo));
                }

                // Update profile photo path
                DB::table('user_profiles')
                    ->where('user_id', $userId)
                    ->update([
                        'profile_photo' => $path,
                        'updated_at' => now()
                    ]);
            } else {
                // Create new profile
                DB::table('user_profiles')->insert([
                    'user_id' => $userId,
                    'profile_photo' => $path,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Build full URL - use storage path (no timestamp - let Glide handle caching)
            $photoUrl = "http://10.0.2.2:8000/storage/{$path}";

            return response()->json([
                'success' => true,
                'message' => 'Profile photo uploaded successfully',
                'data' => [
                    'profile_photo_url' => $photoUrl
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload photo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get profile photo image directly
     * 
     * @param int $userId
     * @return \Illuminate\Http\Response
     */
    public function getProfilePhoto($userId)
    {
        try {
            $profile = DB::table('user_profiles')
                ->where('user_id', $userId)
                ->first(['profile_photo']);

            if (!$profile || !$profile->profile_photo) {
                // Return default image or 404
                return response()->json([
                    'success' => false,
                    'message' => 'No profile photo found'
                ], 404);
            }

            $filePath = storage_path('app/public/' . $profile->profile_photo);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            // Get file info
            $fileSize = filesize($filePath);
            $mimeType = mime_content_type($filePath);
            
            // Read file content
            $fileContent = file_get_contents($filePath);
            
            // Return file with proper headers and content
            return response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Length' => strlen($fileContent),
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get photo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user favorite films with full details
     * 
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFavorites($userId)
    {
        try {
            $favorites = DB::table('user_favorite_films as uf')
                ->join('movies as m', 'uf.film_id', '=', 'm.id')
                ->leftJoin('movie_media as mm_poster', function($join) {
                    $join->on('m.id', '=', 'mm_poster.movie_id')
                         ->where('mm_poster.media_type', '=', 'poster')
                         ->where('mm_poster.is_default', '=', 1);
                })
                ->leftJoin('movie_media as mm_backdrop', function($join) {
                    $join->on('m.id', '=', 'mm_backdrop.movie_id')
                         ->where('mm_backdrop.media_type', '=', 'backdrop')
                         ->where('mm_backdrop.is_default', '=', 1);
                })
                ->where('uf.user_id', $userId)
                ->orderBy('uf.position')
                ->get([
                    'm.id',
                    'm.title',
                    'm.release_year as year',
                    'mm_poster.media_path as poster_path',
                    'mm_backdrop.media_path as backdrop_path',
                    'uf.position'
                ]);

            // Build full URLs for poster and backdrop
            $favorites = $favorites->map(function($fav) {
                if ($fav->poster_path && !str_starts_with($fav->poster_path, 'http')) {
                    $fav->poster_path = "http://10.0.2.2:8000/storage/{$fav->poster_path}";
                }
                if ($fav->backdrop_path && !str_starts_with($fav->backdrop_path, 'http')) {
                    $fav->backdrop_path = "http://10.0.2.2:8000/storage/{$fav->backdrop_path}";
                }
                return $fav;
            });

            return response()->json([
                'success' => true,
                'data' => $favorites
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch favorites: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete profile photo and set to default
     * 
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteProfilePhoto($userId)
    {
        try {
            // Get current profile
            $profile = DB::table('user_profiles')
                ->where('user_id', $userId)
                ->first();

            if ($profile) {
                // Delete old photo file if exists
                if ($profile->profile_photo && file_exists(storage_path('app/public/' . $profile->profile_photo))) {
                    unlink(storage_path('app/public/' . $profile->profile_photo));
                }

                // Set profile_photo to null
                DB::table('user_profiles')
                    ->where('user_id', $userId)
                    ->update([
                        'profile_photo' => null,
                        'updated_at' => now()
                    ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Profile photo reset to default'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete profile photo: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateBackdrop(Request $request, $userId)
    {
        try {
            $backdropPath = $request->input('backdrop_path');
            
            if (!$backdropPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backdrop path is required'
                ], 400);
            }
            
            // Extract relative path if full URL is provided
            // Convert: http://10.0.2.2:8000/storage/movies/2/backdrop/xxx.webp
            // To: movies/2/backdrop/xxx.webp
            if (str_starts_with($backdropPath, 'http')) {
                // Remove base URL part
                $backdropPath = preg_replace('/^https?:\/\/[^\/]+\/storage\//', '', $backdropPath);
            }
            
            // Update backdrop_path in user_profiles
            // First check if profile exists
            $profile = DB::table('user_profiles')->where('user_id', $userId)->first();
            
            if ($profile) {
                DB::table('user_profiles')
                    ->where('user_id', $userId)
                    ->update([
                        'backdrop_path' => $backdropPath,
                        'backdrop_enabled' => true,
                        'updated_at' => now()
                    ]);
            } else {
                // Create profile if not exists
                DB::table('user_profiles')->insert([
                    'user_id' => $userId,
                    'backdrop_path' => $backdropPath,
                    'backdrop_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Backdrop updated successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update backdrop: ' . $e->getMessage()
            ], 500);
        }
    }
}
