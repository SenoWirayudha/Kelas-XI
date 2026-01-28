<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoviePerson extends Model
{
    protected $table = 'movie_persons';
    
    public $timestamps = false;

    protected $fillable = [
        'movie_id',
        'person_id',
        'role_type',
        'character_name',
        'job',
        'order_index',
    ];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function person()
    {
        return $this->belongsTo(Person::class);
    }
}
