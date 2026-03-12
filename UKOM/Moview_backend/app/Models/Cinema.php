<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cinema extends Model
{
    protected $fillable = ['service_id', 'cinema_name', 'city', 'address'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function studios()
    {
        return $this->hasMany(Studio::class);
    }
}
