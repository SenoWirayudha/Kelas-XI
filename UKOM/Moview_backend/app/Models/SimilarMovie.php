<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimilarMovie extends Model
{
    protected $fillable = [
        'movie_id',
        'related_movie_id',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'movie_id');
    }

    public function relatedMovie()
    {
        return $this->belongsTo(Movie::class, 'related_movie_id');
    }
}
