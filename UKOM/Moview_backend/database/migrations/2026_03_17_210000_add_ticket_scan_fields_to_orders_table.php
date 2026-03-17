<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'ticket_code')) {
                $table->string('ticket_code')->nullable()->after('order_code');
                $table->unique('ticket_code', 'orders_ticket_code_unique');
            }

            if (!Schema::hasColumn('orders', 'is_scanned')) {
                $table->boolean('is_scanned')->default(false)->after('status');
            }

            if (!Schema::hasColumn('orders', 'scanned_at')) {
                $table->dateTime('scanned_at')->nullable()->after('is_scanned');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'scanned_at')) {
                $table->dropColumn('scanned_at');
            }

            if (Schema::hasColumn('orders', 'is_scanned')) {
                $table->dropColumn('is_scanned');
            }

            if (Schema::hasColumn('orders', 'ticket_code')) {
                $table->dropUnique('orders_ticket_code_unique');
                $table->dropColumn('ticket_code');
            }
        });
    }
};
