<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmListItem extends Model
{
    protected $fillable = [
        'film_list_id',
        'movie_id',
        'position',
        'poster_media_id',
        'backdrop_media_id',
    ];

    protected $casts = [
        'film_list_id' => 'integer',
        'movie_id' => 'integer',
        'position' => 'integer',
        'poster_media_id' => 'integer',
        'backdrop_media_id' => 'integer',
    ];

    public function list()
    {
        return $this->belongsTo(FilmList::class, 'film_list_id');
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }
}
