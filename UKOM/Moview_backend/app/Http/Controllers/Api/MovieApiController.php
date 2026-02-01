<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\Rating;
use App\Models\Review;
use Illuminate\Http\Request;

class MovieApiController extends Controller
{
    /**
     * Get home screen data
     */
    public function home()
    {
        // Popular this week (most watched/rated in last 7 days)
        $popularMovies = Movie::with(['genres'])
            ->where('status', 'published')
            ->withCount(['ratings as recent_ratings' => function ($query) {
                $query->where('created_at', '>=', now()->subDays(7));
            }])
            ->orderBy('recent_ratings', 'desc')
            ->limit(10)
            ->get();
        
        // Recent reviews from users
        $recentReviews = Review::with(['user', 'movie.genres'])
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'popular_this_week' => $popularMovies->map(function ($movie) {
                    return $this->formatMovieCard($movie);
                }),
                'new_from_friends' => $recentReviews->map(function ($review) {
                    return [
                        'review_id' => $review->id,
                        'user' => [
                            'id' => $review->user->id,
                            'username' => $review->user->username,
                        ],
                        'movie' => $this->formatMovieCard($review->movie),
                        'rating' => $review->rating,
                        'created_at' => $review->created_at->format('Y-m-d H:i:s'),
                    ];
                }),
            ]
        ]);
    }
    
    /**
     * Get popular movies
     */
    public function popular(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        
        $movies = Movie::with(['genres'])
            ->where('status', 'published')
            ->withCount('ratings')
            ->orderBy('ratings_count', 'desc')
            ->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $movies->map(function ($movie) {
                return $this->formatMovieCard($movie);
            }),
            'pagination' => [
                'current_page' => $movies->currentPage(),
                'last_page' => $movies->lastPage(),
                'per_page' => $movies->perPage(),
                'total' => $movies->total(),
            ]
        ]);
    }
    
    /**
     * Get recent reviews
     */
    public function recentReviews(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        
        $reviews = Review::with(['user', 'movie.genres'])
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $reviews->map(function ($review) {
                return [
                    'review_id' => $review->id,
                    'user' => [
                        'id' => $review->user->id,
                        'username' => $review->user->username,
                    ],
                    'movie' => $this->formatMovieCard($review->movie),
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'content' => $review->content,
                    'created_at' => $review->created_at->format('Y-m-d H:i:s'),
                ];
            }),
            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ]
        ]);
    }
    
    /**
     * Get movies list
     */
    public function index(Request $request)
    {
        $query = Movie::with(['genres'])
            ->where('status', 'published');
        
        // Pagination
        $perPage = $request->get('per_page', 20);
        $movies = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $movies->map(function ($movie) {
                return $this->formatMovieList($movie);
            }),
            'pagination' => [
                'current_page' => $movies->currentPage(),
                'last_page' => $movies->lastPage(),
                'per_page' => $movies->perPage(),
                'total' => $movies->total(),
            ]
        ]);
    }
    
    /**
     * Get movie detail
     */
    public function show($id)
    {
        $movie = Movie::with(['genres', 'moviePersons.person', 'movieServices.service'])
            ->find($id);
        
        if (!$movie) {
            return response()->json([
                'success' => false,
                'message' => 'Movie not found'
            ], 404);
        }
        
        // Calculate statistics
        $watchedCount = Rating::where('film_id', $id)->count();
        $reviewsCount = Review::where('film_id', $id)->count();
        $averageRating = Rating::where('film_id', $id)->avg('rating') ?? 0;
        
        // Rating distribution (direct 0-5 star ratings)
        $ratingDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $count = Rating::where('film_id', $id)
                ->where('rating', $i)
                ->count();
            $ratingDistribution[$i] = $count;
        }
        
        // Get director(s)
        $directors = $movie->moviePersons
            ->where('role_type', 'crew')
            ->where('job', 'Director');
        
        // Get cast (sorted by order_index)
        $cast = $movie->moviePersons
            ->where('role_type', 'cast')
            ->sortBy('order_index');
        
        // Get crew (excluding directors, sorted by job)
        $crew = $movie->moviePersons
            ->where('role_type', 'crew')
            ->where('job', '!=', 'Director')
            ->groupBy('job');
        
        // Separate streaming services by type
        $streamingServices = $movie->movieServices
            ->filter(function ($ms) {
                return $ms->service && $ms->service->type === 'streaming';
            })
            ->map(function ($ms) {
                return [
                    'id' => $ms->service->id,
                    'name' => $ms->service->name,
                    'logo_url' => $ms->service->logo_path ? url('storage/' . $ms->service->logo_path) : null,
                    'availability_type' => $ms->availability_type,
                    'release_date' => $ms->release_date,
                    'is_coming_soon' => (bool) $ms->is_coming_soon,
                ];
            })->values();
        
        $theatricalServices = $movie->movieServices
            ->filter(function ($ms) {
                return $ms->service && $ms->service->type === 'theatrical';
            })
            ->map(function ($ms) {
                return [
                    'id' => $ms->service->id,
                    'name' => $ms->service->name,
                    'logo_url' => $ms->service->logo_path ? url('storage/' . $ms->service->logo_path) : null,
                    'release_date' => $ms->release_date,
                    'is_coming_soon' => (bool) $ms->is_coming_soon,
                ];
            })->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $movie->id,
                'title' => $movie->title,
                'year' => $movie->release_year,
                'duration' => $movie->duration . 'm',
                'rating' => $movie->age_rating,
                'synopsis' => $movie->synopsis,
                'poster_path' => $movie->default_poster_path ? url('storage/' . $movie->default_poster_path) : null,
                'backdrop_path' => $movie->default_backdrop_path ? url('storage/' . $movie->default_backdrop_path) : null,
                'trailer_url' => $movie->trailer_url,
                'genres' => $movie->genres->pluck('name'),
                'directors' => $directors->map(function ($mp) {
                    return [
                        'id' => $mp->person->id ?? null,
                        'name' => $mp->person->full_name ?? 'Unknown',
                        'photo_url' => $mp->person->photo_path ? url('storage/' . $mp->person->photo_path) : null,
                    ];
                })->values(),
                'cast' => $cast->map(function ($mp) {
                    return [
                        'id' => $mp->person->id ?? null,
                        'name' => $mp->person->full_name ?? 'Unknown',
                        'character' => $mp->character_name,
                        'photo_url' => $mp->person->photo_path ? url('storage/' . $mp->person->photo_path) : null,
                    ];
                })->values(),
                'crew' => $crew->map(function ($jobGroup, $jobTitle) {
                    return [
                        'job' => $jobTitle,
                        'people' => $jobGroup->map(function ($mp) {
                            return [
                                'id' => $mp->person->id ?? null,
                                'name' => $mp->person->full_name ?? 'Unknown',
                                'photo_url' => $mp->person->photo_path ? url('storage/' . $mp->person->photo_path) : null,
                            ];
                        })->values(),
                    ];
                })->values(),
                'statistics' => [
                    'watched_count' => $watchedCount,
                    'reviews_count' => $reviewsCount,
                    'average_rating' => round($averageRating, 1),
                    'rating_distribution' => $ratingDistribution,
                ],
                'streaming_services' => $streamingServices,
                'theatrical_services' => $theatricalServices,
                'details' => [
                    'original_language' => $movie->movieLanguages->first()->language->name ?? null,
                    'spoken_languages' => $movie->movieLanguages->map(fn($ml) => $ml->language->name)->toArray(),
                    'production_countries' => $movie->movieCountries->map(fn($mc) => $mc->country->name)->toArray(),
                    'production_companies' => $movie->movieProductionHouses->map(fn($mph) => $mph->productionHouse->name)->toArray(),
                ],
            ]
        ]);
    }
    
    /**
     * Get movie reviews
     */
    public function reviews($id, Request $request)
    {
        $perPage = $request->get('per_page', 10);
        
        $reviews = Review::where('film_id', $id)
            ->where('status', 'approved')
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $reviews->map(function ($review) {
                return [
                    'id' => $review->id,
                    'user' => [
                        'id' => $review->user->id,
                        'username' => $review->user->username,
                    ],
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'content' => $review->content,
                    'is_spoiler' => $review->is_spoiler,
                    'created_at' => $review->created_at->format('Y-m-d H:i:s'),
                ];
            }),
            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ]
        ]);
    }
    
    /**
     * Get movie cast and crew
     */
    public function castCrew($id)
    {
        $movie = Movie::with(['moviePersons.person'])->find($id);
        
        if (!$movie) {
            return response()->json([
                'success' => false,
                'message' => 'Movie not found'
            ], 404);
        }
        
        $cast = $movie->moviePersons()
            ->where('role', 'actor')
            ->with('person')
            ->get();
        
        $crew = $movie->moviePersons()
            ->whereIn('role', ['director', 'writer', 'producer'])
            ->with('person')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'cast' => $cast->map(function ($mp) {
                    return [
                        'id' => $mp->person->id,
                        'name' => $mp->person->name,
                        'character' => $mp->character_name,
                        'photo' => $mp->person->photo ? url('storage/' . $mp->person->photo) : null,
                    ];
                }),
                'crew' => $crew->map(function ($mp) {
                    return [
                        'id' => $mp->person->id,
                        'name' => $mp->person->name,
                        'role' => ucfirst($mp->role),
                        'photo' => $mp->person->photo ? url('storage/' . $mp->person->photo) : null,
                    ];
                }),
            ]
        ]);
    }
    
    /**
     * Search movies
     */
    public function search(Request $request)
    {
        $query = $request->get('q');
        
        if (!$query) {
            return response()->json([
                'success' => false,
                'message' => 'Search query is required'
            ], 400);
        }
        
        $movies = Movie::where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('synopsis', 'like', "%{$query}%");
            })
            ->where('status', 'published')
            ->with(['genres'])
            ->limit(20)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $movies->map(function ($movie) {
                return $this->formatMovieCard($movie);
            })
        ]);
    }
    
    /**
     * Format movie for card display (used in lists)
     */
    private function formatMovieCard($movie)
    {
        $watchedCount = Rating::where('film_id', $movie->id)->count();
        $averageRating = Rating::where('film_id', $movie->id)->avg('rating') ?? 0;
        
        return [
            'id' => $movie->id,
            'title' => $movie->title,
            'year' => $movie->release_year,
            'duration' => $movie->duration . 'm',
            'rating' => $movie->age_rating,
            'poster_path' => $movie->default_poster_path ? url('storage/' . $movie->default_poster_path) : null,
            'backdrop_path' => $movie->default_backdrop_path ? url('storage/' . $movie->default_backdrop_path) : null,
            'genres' => $movie->genres->pluck('name'),
            'average_rating' => round($averageRating, 1),
            'watched_count' => $watchedCount,
        ];
    }
    
    /**     * Get person detail (cast/crew)
     */
    public function personDetail($id)
    {
        $person = \App\Models\Person::with(['moviePersons.movie.genres'])
            ->find($id);
        
        if (!$person) {
            return response()->json([
                'success' => false,
                'message' => 'Person not found'
            ], 404);
        }
        
        // Group filmography by role
        $filmography = [];
        
        // Get all roles this person has
        $moviePersons = $person->moviePersons()
            ->with('movie.genres')
            ->whereHas('movie', function ($query) {
                $query->where('status', 'published');
            })
            ->get();
        
        // Group by job/role
        $groupedByJob = $moviePersons->groupBy(function ($mp) {
            if ($mp->role_type === 'cast') {
                return 'Actor';
            } else {
                return $mp->job;
            }
        });
        
        foreach ($groupedByJob as $job => $moviePersonList) {
            $filmography[$job] = $moviePersonList->map(function ($mp) {
                return [
                    'id' => $mp->movie->id,
                    'title' => $mp->movie->title,
                    'year' => $mp->movie->release_year,
                    'poster_path' => $mp->movie->default_poster_path ? url('storage/' . $mp->movie->default_poster_path) : null,
                    'character' => $mp->role_type === 'cast' ? $mp->character_name : null,
                ];
            })->values();
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $person->id,
                'name' => $person->full_name,
                'photo_url' => $person->photo_path ? url('storage/' . $person->photo_path) : null,
                'bio' => $person->bio,
                'date_of_birth' => $person->date_of_birth,
                'nationality' => $person->nationality,
                'primary_role' => $person->primary_role,
                'filmography' => $filmography,
            ]
        ]);
    }
    
    /**     * Format movie for list display
     */
    private function formatMovieList($movie)
    {
        $watchedCount = Rating::where('film_id', $movie->id)->count();
        $averageRating = Rating::where('film_id', $movie->id)->avg('rating') ?? 0;
        
        return [
            'id' => $movie->id,
            'title' => $movie->title,
            'year' => $movie->release_year,
            'duration' => $movie->duration . 'm',
            'rating' => $movie->age_rating,
            'poster_path' => $movie->default_poster_path ? url('storage/' . $movie->default_poster_path) : null,
            'backdrop_path' => $movie->default_backdrop_path ? url('storage/' . $movie->default_backdrop_path) : null,
            'genres' => $movie->genres->pluck('name'),
            'average_rating' => round($averageRating, 1),
            'watched_count' => $watchedCount,
        ];
    }
}
