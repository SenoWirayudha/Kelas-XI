<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guru extends Model
{
    /** @use HasFactory<\Database\Factories\GuruFactory> */
    use HasFactory;

    protected $fillable = [
        'kode_guru',
        'nama_guru',
        'telepon'
    ];

    // Relationship: Guru has many Jadwal
    public function jadwals()
    {
        return $this->hasMany(Jadwal::class);
    }
}
