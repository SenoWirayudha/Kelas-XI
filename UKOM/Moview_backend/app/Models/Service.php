<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'type', 'logo'];

    public function movieServices()
    {
        return $this->hasMany(MovieService::class);
    }
}
