<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Person extends Model
{
    protected $table = 'persons';

    protected $fillable = [
        'full_name',
        'primary_role',
        'photo_path',
        'bio',
        'date_of_birth',
        'nationality',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function moviePersons()
    {
        return $this->hasMany(MoviePerson::class);
    }
}
