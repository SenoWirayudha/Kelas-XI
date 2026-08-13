<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieTheme extends Model
{
    protected $table = 'movie_themes';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['movie_id', 'theme_id'];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function theme()
    {
        return $this->belongsTo(Theme::class);
    }
}