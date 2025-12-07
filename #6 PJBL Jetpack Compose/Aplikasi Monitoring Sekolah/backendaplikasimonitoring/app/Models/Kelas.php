<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    /** @use HasFactory<\Database\Factories\KelasFactory> */
    use HasFactory;

    protected $fillable = [
        'nama_kelas'
    ];

    // Relationship: Kelas has many Jadwal
    public function jadwals()
    {
        return $this->hasMany(Jadwal::class);
    }
}
