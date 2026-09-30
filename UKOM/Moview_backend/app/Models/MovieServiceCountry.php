<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieServiceCountry extends Model
{
    protected $table = 'movie_service_countries';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['movie_id', 'service_id', 'country_id', 'availability_type', 'available_from', 'is_coming_soon'];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }
}
