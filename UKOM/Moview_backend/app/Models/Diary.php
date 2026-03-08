<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diary extends Model
{
    protected $table = 'diaries';

    protected $fillable = [
        'user_id',
        'film_id',
        'review_id',
        'watched_at',
        'rating',
        'is_liked',
        'note',
        'is_rewatched',
    ];

    protected $casts = [
        'is_liked'     => 'boolean',
        'is_rewatched' => 'boolean',
        'watched_at'   => 'date',
        'rating'       => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'film_id');
    }

    public function review()
    {
        return $this->belongsTo(Review::class, 'review_id');
    }

    public function changeMedias()
    {
        return $this->hasMany(UserChangeMedia::class, 'diaries_id');
    }
}
