<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cinema extends Model
{
    public const NETWORKS = ['XXI', 'CGV', 'CINEPOLIS'];

    protected $fillable = ['service_id', 'cinema_name', 'network', 'city', 'address'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function studios()
    {
        return $this->hasMany(Studio::class);
    }
}
