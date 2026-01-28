<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieCountry extends Model
{
    protected $table = 'movie_countries';
    
    public $timestamps = false;

    protected $fillable = ['movie_id', 'country_id'];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }
}
