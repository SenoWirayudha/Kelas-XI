<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahunAjaran extends Model
{
    /** @use HasFactory<\Database\Factories\TahunAjaranFactory> */
    use HasFactory;

    protected $fillable = [
        'tahun',
        'flag'
    ];

    protected $casts = [
        'flag' => 'boolean'
    ];

    // Relationship: TahunAjaran has many Jadwal
    public function jadwals()
    {
        return $this->hasMany(Jadwal::class);
    }
}
