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
        'rating' => 'integer',
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
}
