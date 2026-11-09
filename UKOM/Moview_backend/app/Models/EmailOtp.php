<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Hashed, short-lived OTP codes, bound to a purpose.
 *
 * Every row carries `payload.purpose` (register | change_password |
 * delete_account) so a code issued for one action can never be consumed by
 * another. Rows created before the purpose existed have no key and are treated
 * as registration codes.
 *
 * The `code` column stores sha256(plaintext); the plaintext 6-digit value
 * only ever lives in the OTP email.
 */
class EmailOtp extends Model
{
    public const TTL_MINUTES = 5;
    public const MAX_ATTEMPTS = 3;

    public const PURPOSE_REGISTER = 'register';
    public const PURPOSE_CHANGE_PASSWORD = 'change_password';
    public const PURPOSE_DELETE_ACCOUNT = 'delete_account';

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

    /** Purpose of a record; legacy rows without the key are registration codes. */
    public static function purposeOf(self $record): string
    {
        $purpose = (string) (($record->payload['purpose'] ?? '') ?: '');

        return $purpose !== '' ? $purpose : self::PURPOSE_REGISTER;
    }

    /**
     * The pending code for an email + purpose, or null.
     *
     * One code per purpose: requesting a delete-account code must not
     * invalidate (or be consumed by) a registration/change-password code.
     */
    public static function pending(string $email, string $purpose): ?self
    {
        return static::where('email', $email)
            ->get()
            ->first(fn (self $record) => self::purposeOf($record) === $purpose);
    }

    /** Drops every pending code of ONE purpose, leaving the others intact. */
    public static function purgePurpose(string $email, string $purpose): void
    {
        static::where('email', $email)
            ->get()
            ->each(function (self $record) use ($purpose) {
                if (self::purposeOf($record) === $purpose) {
                    $record->delete();
                }
            });
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
