<?php

namespace App\Models;

use App\Support\ScheduleRules;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'movie_id', 'studio_id', 'show_date', 'show_time', 'ticket_price', 'status',
        'event_id', 'session_title', 'quota',
    ];

    protected $casts = [
        'show_date'    => 'date',
        'ticket_price' => 'decimal:2',
        'quota'        => 'integer',
    ];

    public function movie()
    {
        return $this->belongsTo(Movie::class, 'movie_id');
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /** Ordered films of a festival session (empty for a normal schedule). */
    public function festivalMovies()
    {
        return $this->belongsToMany(Movie::class, 'schedule_movies')
            ->withPivot('sort_order')
            ->orderBy('schedule_movies.sort_order');
    }

    public function isFestival(): bool
    {
        return $this->event_id !== null;
    }

    public function startsAt(): \Carbon\Carbon
    {
        return \App\Support\FestivalSchedule::startsAt($this);
    }

    /** Session end: films + gap for festival sessions, film duration otherwise. */
    public function endsAt(): \Carbon\Carbon
    {
        return $this->isFestival()
            ? \App\Support\FestivalSchedule::endsAt($this)
            : \App\Support\FestivalSchedule::normalEndsAt($this);
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

    /**
     * Active schedules that can still receive online orders at $now (WIB).
     * The window is evaluated in SQL so it stays correct without a cron job.
     */
    public function scopeOpenForOnline(Builder $query, ?\DateTimeInterface $now = null): Builder
    {
        $now = $now ? \Carbon\Carbon::instance($now) : now();

        return $query
            ->where('status', 'active')
            ->whereRaw(
                "(show_date + show_time) > ?",
                [$now->copy()->addMinutes(ScheduleRules::ONLINE_CLOSE_BEFORE_MIN)]
            );
    }

    /**
     * Active schedules that the cashier may still sell at $now (WIB).
     */
    public function scopeOpenForOffline(Builder $query, ?\DateTimeInterface $now = null): Builder
    {
        $now = $now ? \Carbon\Carbon::instance($now) : now();

        return $query
            ->where('status', 'active')
            ->whereRaw(
                "(show_date + show_time) > ?",
                [$now->copy()->subMinutes(ScheduleRules::OFFLINE_CLOSE_AFTER_MIN)]
            );
    }

    public function isOnlineOpen(?\DateTimeInterface $now = null): bool
    {
        return ScheduleRules::isOnlineOpen(
            $this,
            $now ? \Carbon\Carbon::instance($now) : null
        );
    }

    public function isOfflineOpen(?\DateTimeInterface $now = null): bool
    {
        return ScheduleRules::isOfflineOpen(
            $this,
            $now ? \Carbon\Carbon::instance($now) : null
        );
    }

    public function isOpenForChannel(string $channel, ?\DateTimeInterface $now = null): bool
    {
        return $channel === Order::CHANNEL_OFFLINE
            ? $this->isOfflineOpen($now)
            : $this->isOnlineOpen($now);
    }

    public function effectiveStatus(string $channel = 'online', ?\DateTimeInterface $now = null): string
    {
        return ScheduleRules::effectiveStatus(
            $this,
            $channel,
            $now ? \Carbon\Carbon::instance($now) : null
        );
    }
}
