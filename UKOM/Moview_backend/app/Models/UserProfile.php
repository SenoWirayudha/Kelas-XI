<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $table = 'user_profiles';

    protected $fillable = [
        'user_id',
        'display_name',
        'profile_photo',
        'backdrop_path',
        'backdrop_enabled',
        'bio',
        'location',
        'social_link',
    ];

    protected $casts = [
        'backdrop_enabled' => 'boolean',
    ];
}
