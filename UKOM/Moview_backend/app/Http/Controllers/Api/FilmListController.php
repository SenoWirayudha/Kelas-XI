<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FilmListController extends Controller
{
    public function getFilmsByCategory(Request $request)
    {
        $type  = $request->input('type');  // genre, production_house, country, language, year
        $value = $request->input('value');

        try {
            $query = DB::table('movies');

            switch ($type) {
                case 'genre':
                    $query->join('movie_genres', 'movies.id', '=', 'movie_genres.movie_id')
                          ->join('genres', 'movie_genres.genre_id', '=', 'genres.id')
                          ->where('genres.name', $value);
                    break;

                case 'production_house':
                    $query->join('movie_production_houses', 'movies.id', '=', 'movie_production_houses.movie_id')
                          ->join('production_houses', 'movie_production_houses.production_house_id', '=', 'production_houses.id')
                          ->where('production_houses.name', $value);
                    break;

                case 'country':
                    $query->join('movie_countries', 'movies.id', '=', 'movie_countries.movie_id')
                          ->join('countries', 'movie_countries.country_id', '=', 'countries.id')
                          ->where('countries.name', $value);
                    break;

                case 'language':
                    $query->join('movie_languages', 'movies.id', '=', 'movie_languages.movie_id')
                          ->join('languages', 'movie_languages.language_id', '=', 'languages.id')
                          ->where('languages.name', $value);
                    break;

                case 'year':
                    $query->where('movies.release_year', $value);
                    break;

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid category type'
                    ], 400);
            }

            $movies = $query->select(
                'movies.id',
                'movies.title',
                'movies.release_year',
                'movies.default_poster_path',
                DB::raw('(SELECT COUNT(*) FROM ratings WHERE ratings.film_id = movies.id) AS watched_count')
            )
            ->distinct()
            ->orderByDesc('watched_count')
            ->get();

            $moviesWithDetails = $movies->map(function ($movie) {
                $genres = DB::table('movie_genres')
                    ->join('genres', 'movie_genres.genre_id', '=', 'genres.id')
                    ->where('movie_genres.movie_id', $movie->id)
                    ->pluck('genres.name')
                    ->toArray();

                $avgRating = DB::table('reviews')
                    ->where('film_id', $movie->id)
                    ->avg('rating') ?? 0;

                $rawPath = $movie->default_poster_path ?? null;
                $posterUrl = null;
                if ($rawPath) {
                    $posterUrl = str_starts_with($rawPath, 'http')
                        ? $rawPath
                        : "http://10.0.2.2:8000/storage/{$rawPath}";
                }

                return [
                    'id'             => $movie->id,
                    'title'          => $movie->title,
                    'year'           => $movie->release_year,
                    'poster_path'    => $posterUrl,
                    'genres'         => $genres,
                    'average_rating' => round($avgRating, 1),
                    'watched_count'  => (int)$movie->watched_count,
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $moviesWithDetails
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching films: ' . $e->getMessage()
            ], 500);
        }
    }
}
