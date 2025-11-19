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
        'guru_pengganti_id',
        'izin_mulai',
        'izin_selesai',
        'keterangan',
        'status'
    ];

    protected $casts = [
        'izin_mulai' => 'date',
        'izin_selesai' => 'date',
    ];

    // Relationship: GuruMengajar belongs to Jadwal
    public function jadwal()
    {
        return $this->belongsTo(Jadwal::class);
    }
    
    // Relationship: GuruMengajar belongs to Guru (guru pengganti)
    public function guruPengganti()
    {
        return $this->belongsTo(Guru::class, 'guru_pengganti_id');
    }
}
