<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GuruMengajar extends Model
{
    /** @use HasFactory<\Database\Factories\GuruMengajarFactory> */
    use HasFactory;

    protected $fillable = [
        'jadwal_id',
        'keterangan',
        'status'
    ];

    // Relationship: GuruMengajar belongs to Jadwal
    public function jadwal()
    {
        return $this->belongsTo(Jadwal::class);
    }
}
