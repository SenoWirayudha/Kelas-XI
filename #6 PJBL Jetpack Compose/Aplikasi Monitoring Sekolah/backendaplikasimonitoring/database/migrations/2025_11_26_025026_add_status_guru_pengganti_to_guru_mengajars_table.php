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
            $table->string('status_guru_pengganti')->nullable()->after('guru_pengganti_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guru_mengajars', function (Blueprint $table) {
            $table->dropColumn('status_guru_pengganti');
        });
    }
};
