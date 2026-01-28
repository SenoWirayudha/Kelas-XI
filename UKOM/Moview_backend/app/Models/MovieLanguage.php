<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieLanguage extends Model
{
    protected $table = 'movie_languages';
    
    public $timestamps = false;

    protected $fillable = ['movie_id', 'language_id'];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function language()
    {
        return $this->belongsTo(Language::class);
    }
}
