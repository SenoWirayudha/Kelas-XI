<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    public const TYPE_PERCENT = 'percent';
    public const TYPE_FIXED = 'fixed';

    public const SCOPE_ALL = 'all';
    public const SCOPE_FESTIVAL = 'festival';
    public const SCOPE_CINEMA = 'cinema';

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'max_discount',
        'min_purchase',
        'quota_total',
        'per_user_limit',
        'valid_from',
        'valid_until',
        'scope',
        'cinema_id',
        'is_active',
    ];

    protected $casts = [
        'value' => 'integer',
        'max_discount' => 'integer',
        'min_purchase' => 'integer',
        'quota_total' => 'integer',
        'per_user_limit' => 'integer',
        'cinema_id' => 'integer',
        'is_active' => 'boolean',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function cinema()
    {
        return $this->belongsTo(Cinema::class);
    }

    public function usages()
    {
        return $this->hasMany(PromoUsage::class);
    }

    /** Codes are stored uppercase; keep lookup and storage in sync. */
    public static function normalize(?string $code): string
    {
        return strtoupper(trim((string) $code));
    }
}
