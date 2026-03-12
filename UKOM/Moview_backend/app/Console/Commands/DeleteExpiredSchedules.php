<?php

namespace App\Console\Commands;

use App\Models\Schedule;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class DeleteExpiredSchedules extends Command
{
    protected $signature = 'schedules:delete-expired';
    protected $description = 'Mark schedules as expired when their show time has passed';

    public function handle(): int
    {
        $now = Carbon::now();

        $schedules = Schedule::where('status', 'active')->get();

        $count = 0;

        foreach ($schedules as $schedule) {

           $showAt = $schedule->show_date
            ->copy()
            ->setTimeFromTimeString($schedule->show_time);

            if ($showAt->isPast()) {
                $schedule->update([
                    'status' => 'expired'
                ]);

                $count++;
            }
        }

        $this->info("$count schedule(s) marked as expired.");

        return Command::SUCCESS;
    }
}