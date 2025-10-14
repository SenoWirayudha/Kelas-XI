<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relasi ke Siswa Profile
     */
    public function siswaProfile()
    {
        return $this->hasOne(SiswaProfile::class);
    }

    /**
     * Relasi ke Kurikulum Profile
     */
    public function kurikulumProfile()
    {
        return $this->hasOne(KurikulumProfile::class);
    }

    /**
     * Relasi ke Kepala Sekolah Profile
     */
    public function kepalaSekolahProfile()
    {
        return $this->hasOne(KepalaSekolahProfile::class);
    }
}
