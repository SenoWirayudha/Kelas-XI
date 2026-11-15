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
        'networks',
        'is_active',
    ];

    protected $casts = [
        'value' => 'integer',
        'max_discount' => 'integer',
        'min_purchase' => 'integer',
        'quota_total' => 'integer',
        'per_user_limit' => 'integer',
        'cinema_id' => 'integer',
        'networks' => 'array',
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

    /**
     * Networks this code is limited to, in the canonical XXI/CGV/CINEPOLIS
     * order. Empty array means "all networks".
     */
    public function networkList(): array
    {
        $selected = array_map('strtoupper', (array) ($this->networks ?? []));

        return array_values(array_filter(
            Cinema::NETWORKS,
            fn ($network) => in_array($network, $selected, true)
        ));
    }

    /** Codes are stored uppercase; keep lookup and storage in sync. */
    public static function normalize(?string $code): string
    {
        return strtoupper(trim((string) $code));
    }
}
