<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movie extends Model
{
    protected $fillable = [
        'title',
        'release_year',
        'duration',
        'age_rating',
        'synopsis',
        'default_poster_path',
        'default_backdrop_path',
        'status',
    ];

    protected $casts = [
        'release_year' => 'integer',
        'duration' => 'integer',
    ];

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
    }}
