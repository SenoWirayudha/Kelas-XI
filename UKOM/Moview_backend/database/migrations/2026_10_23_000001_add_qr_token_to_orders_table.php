<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Opaque, unguessable QR payload per order (separate from the short,
     * human-readable ticket_code). Rendered only into the buyer's QR screen.
     */
    public function up(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'qr_token')) {
                $table->string('qr_token', 64)->nullable()->after('ticket_code');
                $table->unique('qr_token', 'orders_qr_token_unique');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'qr_token')) {
                $table->dropUnique('orders_qr_token_unique');
                $table->dropColumn('qr_token');
            }
        });
    }
};
