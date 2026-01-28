<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieProductionHouse extends Model
{
    protected $table = 'movie_production_houses';
    
    public $timestamps = false;

    protected $fillable = ['movie_id', 'production_house_id'];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function productionHouse()
    {
        return $this->belongsTo(ProductionHouse::class);
    }
}
