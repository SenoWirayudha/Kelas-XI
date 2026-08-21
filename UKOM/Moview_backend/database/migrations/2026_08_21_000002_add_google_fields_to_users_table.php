<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Distinguishes Google Sign-In accounts from manual-password accounts.
     * `password` is NOT NULL in this schema (Google accounts get a random
     * unguessable one), so `auth_provider` is the source of truth:
     * 'google' = created via Google Sign-In, NULL/'manual' = has a real password.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->index()->after('password');
            $table->string('auth_provider', 20)->nullable()->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'auth_provider']);
        });
    }
};
