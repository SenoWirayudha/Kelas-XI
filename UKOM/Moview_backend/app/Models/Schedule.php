<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    public $timestamps = false;

    protected $fillable = ['movie_id', 'studio_id', 'show_date', 'show_time', 'ticket_price', 'status'];

    protected $casts = [
        'show_date'    => 'date',
        'ticket_price' => 'decimal:2',
    ];

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'movie_id');
    }

    public function studio()
    {
        return $this->belongsTo(Studio::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function orderSeats()
    {
        return $this->hasMany(OrderSeat::class);
    }
}
