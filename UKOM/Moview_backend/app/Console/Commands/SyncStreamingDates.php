<?php

namespace App\Console\Commands;

use App\Services\StreamingSyncService;
use Illuminate\Console\Command;

class SyncStreamingDates extends Command
{
    protected $signature = 'services:sync-streaming-dates';
    protected $description = 'Clear stale release dates on streaming movie_services whose Indonesian release date has passed';

    public function handle(): int
    {
        $fixed = app(StreamingSyncService::class)->syncAllPastDates();

        $this->info("$fixed movie(s) had stale streaming release dates cleared.");

        return Command::SUCCESS;
    }
}