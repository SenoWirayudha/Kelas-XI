<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mapel extends Model
{
    /** @use HasFactory<\Database\Factories\MapelFactory> */
    use HasFactory;

    protected $fillable = [
        'kode_mapel',
        'nama_mapel'
    ];

    // Relationship: Mapel has many Jadwal
    public function jadwals()
    {
        return $this->hasMany(Jadwal::class);
    }
}
