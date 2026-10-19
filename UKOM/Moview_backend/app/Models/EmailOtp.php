<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Hashed, short-lived registration OTP codes.
 * The `code` column stores sha256(plaintext); the plaintext 6-digit value
 * only ever lives in the OTP email. The `payload` column stages the pending
 * registration (username + hashed password) until the code is verified.
 */
class EmailOtp extends Model
{
    public const TTL_MINUTES = 5;
    public const MAX_ATTEMPTS = 3;

    public $timestamps = false;

    protected $fillable = [
        'email',
        'code',
        'expires_at',
        'attempts',
        'payload',
        'created_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'payload' => 'array',
    ];

    /** Hash a plaintext OTP code for storage / lookup. */
    public static function hash(string $plaintext): string
    {
        return hash('sha256', $plaintext);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isMaxedOut(): bool
    {
        return $this->attempts >= self::MAX_ATTEMPTS;
    }
}
