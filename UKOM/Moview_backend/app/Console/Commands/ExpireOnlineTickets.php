<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Support\ScheduleRules;
use Illuminate\Console\Command;

class ExpireOnlineTickets extends Command
{
    protected $signature = 'tickets:expire-online';

    protected $description = 'Mark paid online orders as expired once their show is 30 minutes past';

    public function handle(): int
    {
        $count = 0;

        Order::query()
            ->where('channel', Order::CHANNEL_ONLINE)
            ->where('status', 'paid')
            ->where('is_scanned', false)
            ->with('schedule')
            ->chunkById(200, function ($orders) use (&$count) {
                foreach ($orders as $order) {
                    $schedule = $order->schedule;
                    if (!$schedule) {
                        continue;
                    }

                    if (!ScheduleRules::isOnlineTicketExpired($schedule)) {
                        continue;
                    }

                    $order->update(['status' => 'expired']);
                    $count++;
                }
            });

        $this->info("$count online order(s) marked as expired.");

        return Command::SUCCESS;
    }
}
