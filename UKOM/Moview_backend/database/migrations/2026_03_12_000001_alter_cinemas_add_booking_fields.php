<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cinemas', function (Blueprint $table) {
            // Add new columns
            $table->unsignedBigInteger('service_id')->nullable()->after('id');
            $table->string('city', 100)->default('')->after('name');
            $table->renameColumn('name', 'cinema_name');
            $table->renameColumn('location', 'address');
        });

        // Add FK after renaming (separate statement for MySQL safety)
        Schema::table('cinemas', function (Blueprint $table) {
            $table->foreign('service_id')
                  ->references('id')->on('services')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('cinemas', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn(['service_id', 'city']);
            $table->renameColumn('cinema_name', 'name');
            $table->renameColumn('address', 'location');
        });
    }
};
