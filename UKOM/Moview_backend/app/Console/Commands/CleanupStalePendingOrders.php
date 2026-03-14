<?php

namespace App\Console\Commands;

use App\Services\PendingOrderCleanupService;
use Illuminate\Console\Command;

class CleanupStalePendingOrders extends Command
{
    protected $signature = 'orders:cleanup-stale-pending';
    protected $description = 'Cancel pending orders that exceed the configured timeout and free their seats';

    public function __construct(private readonly PendingOrderCleanupService $cleanupService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $count = $this->cleanupService->cleanupExpiredPendingOrders();
        $this->info("{$count} stale pending order(s) cancelled.");

        return self::SUCCESS;
    }
}
