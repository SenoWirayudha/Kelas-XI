<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    // services table has created_at but no updated_at column.
    public const UPDATED_AT = null;

    protected $fillable = ['name', 'type', 'logo_path'];

    public function movieServices()
    {
        return $this->hasMany(MovieService::class);
    }
}
