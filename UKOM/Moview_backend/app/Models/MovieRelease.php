<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieRelease extends Model
{
    protected $fillable = [
        'movie_id',
        'type',
        'country_code',
        'name',
        'release_date',
    ];

    protected $casts = [
        'release_date' => 'date',
    ];

    public const TYPE_PREMIERE = 'premiere';
    public const TYPE_THEATRICAL = 'theatrical';
    public const TYPE_STREAMING = 'streaming';

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }
}