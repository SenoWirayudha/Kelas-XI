<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\Person;
use App\Models\Rating;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MovieApiController extends Controller
{
    private function mapTheatricalMovie(Movie $movie, bool $isPreorder): array
    {
        $theatricalReleaseDate = $movie->movieServices
            ->map(fn($movieService) => $movieService->release_date)
            ->filter()
            ->sort()
            ->first();

        $isComingSoon = $movie->movieServices
            ->contains(fn($movieService) => (int) ($movieService->is_coming_soon ?? 0) === 1);

        return [
            'id' => $movie->id,
            'title' => $movie->title,
            'poster' => $movie->default_poster_path ? url('storage/' . $movie->default_poster_path) : null,
            'year' => (int) $movie->release_year,
            'age_rating' => $movie->age_rating,
            'genre' => $movie->genres->pluck('name')->first(),
            'release_date' => $theatricalReleaseDate,
            'is_coming_soon' => $isComingSoon ? 1 : 0,
            'is_preorder' => $isPreorder,
            'has_schedule' => $movie->schedules->isNotEmpty(),
        ];
    }

    /**
     * Get home screen data
     */
    public function home()
    {
        // Popular this week (most watched/rated in last 7 days) - based on total ratings count
        $popularMovieIds = DB::table('ratings')
            ->select('film_id', DB::raw('COUNT(*) as view_count'))
            ->whereBetween('created_at', [
                now()->subWeek(),
                now()
            ])
            ->groupBy('film_id')
            ->orderBy('view_count', 'desc')
            ->limit(10)
            ->pluck('film_id');
        
        $popularMovies = Movie::with(['genres'])
            ->whereIn('id', $popularMovieIds)
            ->where('status', 'published')
            ->get()
            ->sortBy(function($movie) use ($popularMovieIds) {
                return array_search($movie->id, $popularMovieIds->toArray());
            })
            ->values();
        
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
     * Get popular movies this week (most watched in last 7 days)
     */
    public function popularThisWeek(Request $request)
    {
        $limit = $request->get('limit', 50);
        
        // Popular this week (most watched/rated in last 7 days) - based on total ratings count
        $popularMovieIds = DB::table('ratings')
            ->select('film_id', DB::raw('COUNT(*) as view_count'))
            ->whereBetween('created_at', [
                now()->subWeek(),
                now()
            ])
            ->groupBy('film_id')
            ->orderBy('view_count', 'desc')
            ->limit($limit)
            ->pluck('film_id');
        
        $movies = Movie::with(['genres'])
            ->whereIn('id', $popularMovieIds)
            ->where('status', 'published')
            ->get()
            ->sortBy(function($movie) use ($popularMovieIds) {
                return array_search($movie->id, $popularMovieIds->toArray());
            })
            ->values();
        
        return response()->json([
            'success' => true,
            'data' => $movies->map(function ($movie) {
                return $this->formatMovieCard($movie);
            })
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
                'title' => $movie->title ?? 'Unknown Title',
                'year' => $movie->release_year,
                'duration' => $movie->duration ? $movie->duration . 'm' : null,
                'rating' => $movie->age_rating ?? 'Not Rated',
                'synopsis' => $movie->synopsis ?? 'No synopsis available.',
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
        $perPage = $request->get('per_page', 20);

        $reviews = DB::table('reviews')
            ->join('users', 'reviews.user_id', '=', 'users.id')
            ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
            ->where('reviews.film_id', $id)
            ->whereIn('reviews.status', ['published', 'flagged'])
            ->orderByRaw('(SELECT COUNT(*) FROM review_likes WHERE review_likes.review_id = reviews.id) DESC')
            ->orderBy('reviews.created_at', 'desc')
            ->select(
                'reviews.id',
                'reviews.user_id',
                'users.username',
                'user_profiles.profile_photo',
                'reviews.rating',
                'reviews.title',
                'reviews.content',
                'reviews.is_spoiler',
                'reviews.created_at'
            )
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $reviews->map(function ($review) {
                $profilePhoto = null;
                if ($review->profile_photo) {
                    $profilePhoto = str_starts_with($review->profile_photo, 'http')
                        ? $review->profile_photo
                        : 'http://10.0.2.2:8000/storage/' . $review->profile_photo;
                }

                return [
                    'id' => $review->id,
                    'user' => [
                        'id' => $review->user_id,
                        'username' => $review->username,
                        'profile_photo' => $profilePhoto,
                    ],
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'content' => $review->content,
                    'is_spoiler' => (bool) $review->is_spoiler,
                    'created_at' => $review->created_at,
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
     * Search movies, persons, production houses, or users
     */
    public function search(Request $request)
    {
        $query = $request->get('q');
        $type = $request->get('type', 'all'); // all, movies, cast_crew, production_houses, people
        
        if (!$query) {
            return response()->json([
                'success' => false,
                'message' => 'Search query is required'
            ], 400);
        }
        
        $results = [];
        
        // Search Movies
        if ($type === 'all' || $type === 'movies') {
            $movies = Movie::where(function ($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('synopsis', 'like', "%{$query}%");
                })
                ->where('status', 'published')
                ->with(['genres'])
                ->limit(20)
                ->get();
            
            $results['movies'] = $movies->map(function ($movie) {
                return $this->formatMovieCard($movie);
            });
        }
        
        // Search Cast & Crew (Persons)
        if ($type === 'all' || $type === 'cast_crew') {
            $persons = DB::table('persons')
                ->where('full_name', 'like', "%{$query}%")
                ->limit(20)
                ->get();
            
            $results['cast_crew'] = $persons->map(function ($person) {
                return [
                    'id' => $person->id,
                    'name' => $person->full_name,
                    'role' => $person->primary_role ?? 'Actor',
                    'known_for' => '', // Will be loaded on person detail page
                    'avatar_url' => $person->photo_path ? url('storage/' . $person->photo_path) : null,
                ];
            });
        }
        
        // Search Production Houses
        if ($type === 'all' || $type === 'production_houses') {
            $productionHouses = DB::table('production_houses')
                ->where('name', 'like', "%{$query}%")
                ->limit(20)
                ->get();
            
            $results['production_houses'] = $productionHouses->map(function ($house) {
                return [
                    'id' => $house->id,
                    'name' => $house->name,
                ];
            });
        }
        
        // Search People (Users)
        if ($type === 'all' || $type === 'people') {
            $users = DB::table('users')
                ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->where('users.status', 'active')
                ->where(function($q) use ($query) {
                    $q->where('users.username', 'like', "%{$query}%")
                      ->orWhere('user_profiles.display_name', 'like', "%{$query}%");
                })
                ->select(
                    'users.id',
                    'users.username',
                    'user_profiles.display_name',
                    'user_profiles.profile_photo'
                )
                ->limit(20)
                ->get();
            
            $results['people'] = $users->map(function ($user) {
                // Count films watched (any film with a rating = watched)
                $filmsCount = DB::table('ratings')
                    ->where('user_id', $user->id)
                    ->count();
                
                // Count reviews
                $reviewsCount = DB::table('reviews')
                    ->where('user_id', $user->id)
                    ->where('status', 'published')
                    ->count();
                
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'full_name' => $user->display_name ?? $user->username,
                    'avatar_url' => $user->profile_photo ? url('storage/' . $user->profile_photo) : null,
                    'films_count' => $filmsCount,
                    'reviews_count' => $reviewsCount,
                ];
            });
        }
        
        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }

    /**
     * Get movies currently showing in Indonesian theaters
     * (theatrical services, is_coming_soon = 0)
     */
    public function nowShowing(Request $request)
    {
        $limit = $request->get('limit', 0); // 0 = all

        $query = Movie::with([
                'movieServices' => fn($movieServiceQuery) => $movieServiceQuery
                    ->whereHas('service', fn($serviceQuery) => $serviceQuery->where('type', 'theatrical')),
                'schedules:id,movie_id',
                'genres:id,name',
            ])
            ->where('status', 'published')
            ->where(function ($movieQuery) {
                // Now Showing original: theatrical + release_date null + is_coming_soon=0
                $movieQuery->whereHas('movieServices', fn($movieServiceQuery) => $movieServiceQuery
                    ->whereNull('release_date')
                    ->where('is_coming_soon', 0)
                    ->whereHas('service', fn($serviceQuery) => $serviceQuery->where('type', 'theatrical')))
                    // Merge preorder into now showing: theatrical + release_date not null + has schedule
                    ->orWhere(function ($preorderQuery) {
                        $preorderQuery->whereHas('movieServices', fn($movieServiceQuery) => $movieServiceQuery
                            ->whereNotNull('release_date')
                            ->whereHas('service', fn($serviceQuery) => $serviceQuery->where('type', 'theatrical')))
                            ->whereHas('schedules');
                    });
            })
            ->orderByDesc('id');

        if ((int) $limit > 0) {
            $query->limit((int) $limit);
        }

        $movies = $query->get();

        return response()->json([
            'success' => true,
            'data' => $movies->map(fn(Movie $movie) => $this->mapTheatricalMovie($movie, $movie->schedules->isNotEmpty() && $movie->movieServices->contains(fn($movieService) => !empty($movieService->release_date))))->values(),
        ]);
    }

    /**
     * Get theatrical preorder movies
     * Rules:
     * - service.type = theatrical
     * - release_date IS NOT NULL
     * - has schedule (EXISTS schedules)
     */
    public function preorder(Request $request)
    {
        $limit = $request->get('limit', 0); // 0 = all

        $query = Movie::with([
                'movieServices' => fn($movieServiceQuery) => $movieServiceQuery
                    ->whereNotNull('release_date')
                    ->whereHas('service', fn($serviceQuery) => $serviceQuery->where('type', 'theatrical')),
                'schedules:id,movie_id',
                'genres:id,name',
            ])
            ->where('status', 'published')
            ->whereHas('movieServices', fn($movieServiceQuery) => $movieServiceQuery
                ->whereNotNull('release_date')
                ->whereHas('service', fn($serviceQuery) => $serviceQuery->where('type', 'theatrical')))
            ->whereHas('schedules')
            ->orderByDesc('id');

        if ((int) $limit > 0) {
            $query->limit((int) $limit);
        }

        $movies = $query->get();

        return response()->json([
            'success' => true,
            'data' => $movies->map(fn(Movie $movie) => $this->mapTheatricalMovie($movie, true))->values(),
        ]);
    }

    /**
     * Get upcoming movies in Indonesian theaters
     * (theatrical services, is_coming_soon = 1)
     */
    public function upcoming(Request $request)
    {
        $limit = $request->get('limit', 0); // 0 = all

        $query = Movie::with([
                'movieServices' => fn($movieServiceQuery) => $movieServiceQuery
                    ->whereHas('service', fn($serviceQuery) => $serviceQuery->where('type', 'theatrical')),
                'schedules:id,movie_id',
                'genres:id,name',
            ])
            ->where('status', 'published')
            ->whereHas('movieServices', function ($movieServiceQuery) {
                $movieServiceQuery
                    ->whereHas('service', fn($serviceQuery) => $serviceQuery->where('type', 'theatrical'))
                    ->where(function ($conditionQuery) {
                        // release_date exists OR marked coming soon
                        $conditionQuery->whereNotNull('release_date')
                            ->orWhere('is_coming_soon', 1);
                    });
            })
            ->whereDoesntHave('schedules')
            ->orderByDesc('id');

        if ((int) $limit > 0) {
            $query->limit((int) $limit);
        }

        $movies = $query->get();

        $sortedMovies = $movies->sortBy(function (Movie $movie) {
            $hasReleaseDate = $movie->movieServices
                ->contains(fn($movieService) => !empty($movieService->release_date));

            $isComingSoon = $movie->movieServices
                ->contains(fn($movieService) => (int) ($movieService->is_coming_soon ?? 0) === 1);

            $releaseDate = $movie->movieServices
                ->map(fn($movieService) => $movieService->release_date)
                ->filter()
                ->sort()
                ->first() ?? '9999-12-31';

            return [
                $hasReleaseDate ? 0 : 1,
                $releaseDate,
                $isComingSoon ? 1 : 0,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $sortedMovies->map(fn(Movie $movie) => $this->mapTheatricalMovie($movie, false))->values(),
        ]);
    }

    /**
     * Get Academy Award nominees (Best Picture, 98th)
     * Hardcoded film IDs - add more by appending to the array below.
     *
     * TO ADD A NEW FILM:
     * 1. Find the film's ID in the movies table (check /api/v1/movies or database)
     * 2. Append the ID to the $nomineeIds array below
     * 3. Save - no migration needed
     *
     * Current nominees:
     *   47 = One Battle After Another
     *   15 = Sinners
     *   30 = Hamnet
     *   31 = Marty Supreme
     *   16 = The Secret Agent
     *   10 = Sentimental Value
     */
    public function academyAwardNominees()
    {
        $nomineeIds = [66, 47, 15, 30, 67, 31, 16, 10, 58];

        $movies = Movie::with(['genres'])
            ->whereIn('id', $nomineeIds)
            ->where('status', 'published')
            ->get()
            ->sortBy(fn($m) => array_search($m->id, $nomineeIds))
            ->values();

        return response()->json([
            'success' => true,
            'data' => $movies->map(fn($m) => $this->formatMovieCard($m))
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
        $person = Person::with(['moviePersons.movie.genres'])
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
