<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'cinema_id',
        'title',
        'description',
        'banner',
        'start_date',
        'end_date',
        'sale_starts_at',
        'is_published',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'sale_starts_at' => 'datetime',
        'is_published' => 'boolean',
    ];

    public function cinema()
    {
        return $this->belongsTo(Cinema::class);
    }

    /** Festival sessions (schedule rows tagged with this event). */
    public function sessions()
    {
        return $this->hasMany(Schedule::class)->orderBy('show_date')->orderBy('show_time');
    }

    public function scopeForCinema($query, ?int $cinemaId)
    {
        return $cinemaId === null ? $query : $query->where('cinema_id', $cinemaId);
    }

    public function isPublished(): bool
    {
        return (bool) $this->is_published;
    }

    /** First session start (used to validate the sales opening time). */
    public function firstSessionStart(): ?Carbon
    {
        $first = $this->sessions()->first();

        return $first?->startsAt();
    }
}