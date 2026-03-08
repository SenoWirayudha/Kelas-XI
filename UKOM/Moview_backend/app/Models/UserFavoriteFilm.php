<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserFavoriteFilm extends Model
{
    protected $table = 'user_favorite_films';

    protected $fillable = ['user_id', 'film_id', 'position'];

    protected $casts = [
        'position' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'film_id');
    }

    public function changeMedias()
    {
        return $this->hasMany(UserChangeMedia::class, 'favorite_id');
    }
}
