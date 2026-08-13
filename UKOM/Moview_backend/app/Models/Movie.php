<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movie extends Model
{
    protected $fillable = [
        'title',
        'original_title',
        'release_year',
        'duration',
        'age_rating',
        'synopsis',
        'trailer_url',
        'default_poster_path',
        'default_backdrop_path',
        'status',
    ];

    protected $casts = [
        'release_year' => 'integer',
        'duration' => 'integer',
    ];

    /**
     * Get the average rating for the movie (calculated from ratings table)
     */
    public function getRatingAverageAttribute()
    {
        return $this->ratings()->avg('rating') ?? 0;
    }
    
    /**
     * Get total reviews count
     */
    public function getTotalReviewsAttribute()
    {
        return $this->ratings()->count();
    }

    /**
     * Get all media (posters & backdrops) for the movie
     */
    public function movieMedia()
    {
        return $this->hasMany(MovieMedia::class, 'movie_id');
    }

    /**
     * Get posters only
     */
    public function posters()
    {
        return $this->hasMany(MovieMedia::class, 'movie_id')->where('media_type', 'poster');
    }

    /**
     * Get backdrops only
     */
    public function backdrops()
    {
        return $this->hasMany(MovieMedia::class, 'movie_id')->where('media_type', 'backdrop');
    }

    /**
     * Get genres through pivot table
     */
    public function movieGenres()
    {
        return $this->hasMany(MovieGenre::class, 'movie_id');
    }

    /**
     * Get genres directly (many-to-many)
     */
    public function genres()
    {
        return $this->belongsToMany(Genre::class, 'movie_genres', 'movie_id', 'genre_id');
    }

    /**
     * Get cast & crew
     */
    public function moviePersons()
    {
        return $this->hasMany(MoviePerson::class, 'movie_id');
    }

    /**
     * Get cast only
     */
    public function cast()
    {
        return $this->hasMany(MoviePerson::class, 'movie_id')->where('role_type', 'cast');
    }

    /**
     * Get crew only
     */
    public function crew()
    {
        return $this->hasMany(MoviePerson::class, 'movie_id')->where('role_type', 'crew');
    }

    /**
     * Get services (streaming platforms)
     */
    public function movieServices()
    {
        return $this->hasMany(MovieService::class, 'movie_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'movie_id');
    }

    /**
     * Get ratings for the movie
     */
    public function ratings()
    {
        return $this->hasMany(Rating::class, 'film_id');
    }

    /**
     * Get reviews for the movie
     */
    public function reviews()
    {
        return $this->hasMany(Review::class, 'film_id');
    }

    /**
     * Get likes for the movie
     */
    public function likes()
    {
        return $this->hasMany(MovieLike::class, 'film_id');
    }

    public function movieCountries()
    {
        return $this->hasMany(MovieCountry::class);
    }

    public function movieLanguages()
    {
        return $this->hasMany(MovieLanguage::class);
    }

    public function movieProductionHouses()
    {
        return $this->hasMany(MovieProductionHouse::class);
    }

    public function movieThemes()
    {
        return $this->hasMany(MovieTheme::class);
    }

    /**
     * Multi-release rows (premiere / theatrical / streaming) with their own dates.
     * One movie may have many rows (e.g. Cannes premiere, theatrical in Indonesia, Netflix US).
     */
    public function movieReleases()
    {
        return $this->hasMany(MovieRelease::class, 'movie_id')->orderBy('release_date');
    }

    /**
     * The "primary" or main release date used for sorting & year filtering.
     * Priority: earliest premiere/festival date if present, otherwise the earliest
     * theatrical/streaming date. Implemented as a computed value here so every query
     * uses one consistent source instead of hardcoding the logic elsewhere.
     */
    public function getPrimaryReleaseDateAttribute()
    {
        $premiere = $this->movieReleases()
            ->where('type', MovieRelease::TYPE_PREMIERE)
            ->orderBy('release_date')
            ->value('release_date');

        if ($premiere) {
            return $premiere;
        }

        return $this->movieReleases()
            ->whereIn('type', [MovieRelease::TYPE_THEATRICAL, MovieRelease::TYPE_STREAMING])
            ->orderBy('release_date')
            ->value('release_date');
    }

    /**
     * Selling status: "released" once at least one theatrical or streaming row has a
     * release_date that has passed. Premiere-only films stay "coming soon".
     */
    public function getReleaseStatusAttribute()
    {
        $publicRelease = $this->movieReleases()
            ->whereIn('type', [MovieRelease::TYPE_THEATRICAL, MovieRelease::TYPE_STREAMING])
            ->where('release_date', '<=', now()->toDateString())
            ->exists();

        return $publicRelease ? 'released' : 'coming_soon';
    }
}
