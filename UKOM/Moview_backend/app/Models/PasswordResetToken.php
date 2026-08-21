<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Hashed, single-use password reset tokens.
 * The `token` column stores sha256(plaintext); the plaintext value only ever
 * lives in the reset email link.
 */
class PasswordResetToken extends Model
{
    public const TTL_MINUTES = 60;

    public $timestamps = false;

    protected $fillable = [
        'email',
        'token',
        'expires_at',
        'used_at',
        'created_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /** Hash a plaintext token for storage / lookup. */
    public static function hash(string $plaintext): string
    {
        return hash('sha256', $plaintext);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }
}
