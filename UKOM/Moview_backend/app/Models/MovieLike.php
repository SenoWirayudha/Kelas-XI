<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieLike extends Model
{
    protected $fillable = [
        'user_id',
        'film_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'film_id');
    }
}
