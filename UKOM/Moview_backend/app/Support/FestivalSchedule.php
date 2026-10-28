<?php

namespace App\Support;

use App\Models\Schedule;
use Carbon\Carbon;

/**
 * Festival-session timing rules.
 *
 * A festival session plays several films back to back; its end time is never entered by
 * hand. Change [GAP_MINUTES] to adjust the break inserted after the last film.
 */
final class FestivalSchedule
{
    /** Break after the film line-up (minutes). */
    public const GAP_MINUTES = 10;

    /** Every date/time on this feature is shown and compared in Indonesian time (WIB). */
    public const TIMEZONE = 'Asia/Jakarta';

    /** Now in WIB. */
    public static function now(): Carbon
    {
        return Carbon::now(self::TIMEZONE);
    }

    /** Parses any date/time value as WIB wall-clock time. */
    public static function parse(mixed $value): Carbon
    {
        return Carbon::parse((string) $value, self::TIMEZONE);
    }

    /** Today (WIB) as Y-m-d. */
    public static function today(): string
    {
        return self::now()->toDateString();
    }

    public static function startsAt(Schedule $schedule): Carbon
    {
        $date = $schedule->show_date instanceof Carbon
            ? $schedule->show_date->copy()->setTimezone(self::TIMEZONE)
            : Carbon::parse((string) $schedule->show_date, self::TIMEZONE);

        return $date->startOfDay()->setTimeFromTimeString((string) $schedule->show_time);
    }

    /** Sum of every film's duration in the session (minutes). */
    public static function filmsDuration(Schedule $schedule): int
    {
        $films = $schedule->relationLoaded('festivalMovies')
            ? $schedule->festivalMovies
            : $schedule->festivalMovies()->get();

        if ($films->isEmpty()) {
            // Normal schedule (or legacy festival row): fall back to the single film.
            return (int) ($schedule->movie?->duration ?? 0);
        }

        return (int) $films->sum(fn ($film) => (int) $film->duration);
    }

    /** When the session finishes, gap included. */
    public static function endsAt(Schedule $schedule): Carbon
    {
        return self::startsAt($schedule)
            ->addMinutes(max(1, self::filmsDuration($schedule)) + self::GAP_MINUTES);
    }

    /** End time of a normal (non-festival) schedule: start + film duration. */
    public static function normalEndsAt(Schedule $schedule): Carbon
    {
        return self::startsAt($schedule)
            ->addMinutes(max(1, (int) ($schedule->movie?->duration ?? 0)));
    }
}