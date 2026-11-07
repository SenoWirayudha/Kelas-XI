<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Promo codes are validated and priced server-side; Midtrans only ever sees the
 * final gross_amount. Usage rows are the source of truth for quota and per-user
 * limits (reserved while pending, used after settlement).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('description')->nullable();
            $table->string('type', 16)->default('percent'); // percent | fixed
            $table->unsignedInteger('value');
            $table->unsignedInteger('max_discount')->nullable(); // percent cap
            $table->unsignedInteger('min_purchase')->default(0);
            $table->unsignedInteger('quota_total')->nullable();
            $table->unsignedInteger('per_user_limit')->default(1);
            $table->dateTime('valid_from')->nullable();
            $table->dateTime('valid_until')->nullable();
            $table->string('scope', 16)->default('all'); // all | festival | cinema
            $table->unsignedBigInteger('cinema_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('promo_usages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('promo_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('order_id');
            $table->string('status', 16)->default('reserved'); // reserved | used
            $table->unsignedInteger('discount_amount')->default(0);
            $table->timestamps();

            $table->unique(['promo_id', 'order_id']);
            $table->index(['promo_id', 'status']);
            $table->index(['promo_id', 'user_id', 'status']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('promo_id')->nullable()->after('total_price');
            $table->string('promo_code', 32)->nullable()->after('promo_id');
            $table->unsignedInteger('discount_amount')->default(0)->after('promo_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['promo_id', 'promo_code', 'discount_amount']);
        });

        Schema::dropIfExists('promo_usages');
        Schema::dropIfExists('promos');
    }
};
