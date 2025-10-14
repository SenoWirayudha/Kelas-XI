<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KepalaSekolahProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nip',
        'periode_mulai',
        'periode_selesai',
        'alamat',
        'no_telp',
    ];

    protected $casts = [
        'periode_mulai' => 'date',
        'periode_selesai' => 'date',
    ];

    /**
     * Relasi ke User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
