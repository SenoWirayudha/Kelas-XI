<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'user_id',
        'film_id',
        'rating',
        'title',
        'content',
        'backdrop_path',
        'is_spoiler',
        'status',
    ];

    protected $casts = [
        'rating' => 'float',
        'is_spoiler' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'film_id');
    }

    /**
     * Likes from OTHER users (review_likes table).
     * Not to be confused with reviews.is_liked, which is the author's own
     * "liked this movie" flag.
     */
    public function likes()
    {
        return $this->belongsToMany(User::class, 'review_likes');
    }

    public function comments()
    {
        return $this->hasMany(ReviewComment::class);
    }
}
