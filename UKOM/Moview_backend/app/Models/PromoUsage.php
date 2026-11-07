<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromoUsage extends Model
{
    public const STATUS_RESERVED = 'reserved';
    public const STATUS_USED = 'used';

    protected $fillable = [
        'promo_id',
        'user_id',
        'order_id',
        'status',
        'discount_amount',
    ];

    protected $casts = [
        'promo_id' => 'integer',
        'user_id' => 'integer',
        'order_id' => 'integer',
        'discount_amount' => 'integer',
    ];

    public function promo()
    {
        return $this->belongsTo(Promo::class);
    }
}
