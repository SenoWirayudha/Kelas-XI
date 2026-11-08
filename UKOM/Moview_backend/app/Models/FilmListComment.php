<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmListComment extends Model
{
    protected $fillable = ['film_list_id', 'user_id', 'content'];

    protected $casts = [
        'film_list_id' => 'integer',
        'user_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function list()
    {
        return $this->belongsTo(FilmList::class, 'film_list_id');
    }
}
