<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('cinema_id')->constrained('cinemas')->cascadeOnDelete();
            $table->date('tanggal');
            $table->time('jam_masuk');
            $table->time('jam_pulang')->nullable();
            $table->timestamps();

            $table->unique(['staff_id', 'tanggal']);
            $table->index(['cinema_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_attendances');
    }
};
