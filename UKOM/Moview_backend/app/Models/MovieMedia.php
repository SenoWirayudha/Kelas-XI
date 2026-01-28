<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieMedia extends Model
{
    protected $table = 'movie_media';
    
    public $timestamps = false;

    protected $fillable = [
        'movie_id',
        'media_type',
        'media_path',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }
}
