<?php

namespace App\Support;

use App\Models\Schedule;
use Carbon\Carbon;

/**
 * Server-side schedule selling windows. No cron / scheduled job: every query
 * and every order checks the clock in the app timezone (Asia/Jakarta / WIB).
 *
 * Online sales stop 10 minutes before the show starts; the cashier (offline)
 * may still sell until 15 minutes after the show starts.
 */
final class ScheduleRules
{
    public const ONLINE_CLOSE_BEFORE_MIN = 10;
    public const OFFLINE_CLOSE_AFTER_MIN = 15;

    /**
     * Online tickets stay valid (and scannable) until this many minutes after the show
     * starts; afterwards they are marked/reported as expired.
     */
    public const ONLINE_TICKET_VALID_AFTER_MIN = 30;

    public static function startsAt(Schedule $schedule): Carbon
    {
        $date = $schedule->show_date instanceof Carbon
            ? $schedule->show_date->copy()
            : Carbon::parse((string) $schedule->show_date);

        return $date->startOfDay()->setTimeFromTimeString((string) $schedule->show_time);
    }

    /** Moment an online ticket stops being valid (show start + grace). */
    public static function onlineTicketExpiresAt(Schedule $schedule): Carbon
    {
        return self::startsAt($schedule)->addMinutes(self::ONLINE_TICKET_VALID_AFTER_MIN);
    }

    /** True once an online ticket for this schedule must be treated as expired. */
    public static function isOnlineTicketExpired(Schedule $schedule, ?Carbon $now = null): bool
    {
        return ($now ?? now())->greaterThanOrEqualTo(self::onlineTicketExpiresAt($schedule));
    }

    public static function onlineClosesAt(Schedule $schedule): Carbon
    {
        return self::startsAt($schedule)->subMinutes(self::ONLINE_CLOSE_BEFORE_MIN);
    }

    public static function offlineClosesAt(Schedule $schedule): Carbon
    {
        return self::startsAt($schedule)->addMinutes(self::OFFLINE_CLOSE_AFTER_MIN);
    }

    public static function isOnlineOpen(Schedule $schedule, ?Carbon $now = null): bool
    {
        return $schedule->status === 'active'
            && ($now ?? now())->lt(self::onlineClosesAt($schedule));
    }

    public static function isOfflineOpen(Schedule $schedule, ?Carbon $now = null): bool
    {
        return $schedule->status === 'active'
            && ($now ?? now())->lt(self::offlineClosesAt($schedule));
    }

    public static function effectiveStatus(Schedule $schedule, string $channel = 'online', ?Carbon $now = null): string
    {
        if ($schedule->status !== 'active') {
            return (string) $schedule->status;
        }

        return $channel === 'offline'
            ? (self::isOfflineOpen($schedule, $now) ? 'active' : 'closed')
            : (self::isOnlineOpen($schedule, $now) ? 'active' : 'closed');
    }
}