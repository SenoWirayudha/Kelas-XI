<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionHouse extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'logo'];

    public function movieProductionHouses()
    {
        return $this->hasMany(MovieProductionHouse::class);
    }
}
