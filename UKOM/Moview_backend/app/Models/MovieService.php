<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieService extends Model
{
    protected $table = 'movie_services';
    
    public $timestamps = false;

    protected $fillable = [
        'movie_id',
        'service_id',
        'availability_type',
        'release_date',
    ];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
