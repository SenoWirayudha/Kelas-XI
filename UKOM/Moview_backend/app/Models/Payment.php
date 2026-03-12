<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'midtrans_transaction_id',
        'midtrans_order_id',
        'payment_type',
        'transaction_status',
        'fraud_status',
        'gross_amount',
        'payment_time',
        'midtrans_raw_response',
    ];

    protected $casts = [
        'gross_amount'           => 'decimal:2',
        'payment_time'           => 'datetime',
        'midtrans_raw_response'  => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
