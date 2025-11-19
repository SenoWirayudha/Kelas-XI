<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guru_mengajars', function (Blueprint $table) {
            $table->date('izin_mulai')->nullable()->after('guru_pengganti_id');
            $table->date('izin_selesai')->nullable()->after('izin_mulai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guru_mengajars', function (Blueprint $table) {
            $table->dropColumn(['izin_mulai', 'izin_selesai']);
        });
    }
};
