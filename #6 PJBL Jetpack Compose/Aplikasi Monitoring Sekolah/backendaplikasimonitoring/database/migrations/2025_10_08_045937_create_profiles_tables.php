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
        // Siswa Profiles
        Schema::create('siswa_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nis')->unique()->nullable();
            $table->string('kelas')->nullable();
            $table->string('jurusan')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->text('alamat')->nullable();
            $table->string('no_telp')->nullable();
            $table->string('nama_wali')->nullable();
            $table->string('no_telp_wali')->nullable();
            $table->timestamps();
        });

        // Kurikulum Profiles (Staff Kurikulum)
        Schema::create('kurikulum_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nip')->unique()->nullable();
            $table->string('jabatan')->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->text('alamat')->nullable();
            $table->string('no_telp')->nullable();
            $table->timestamps();
        });

        // Kepala Sekolah Profiles
        Schema::create('kepala_sekolah_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nip')->unique()->nullable();
            $table->date('periode_mulai')->nullable();
            $table->date('periode_selesai')->nullable();
            $table->text('alamat')->nullable();
            $table->string('no_telp')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kepala_sekolah_profiles');
        Schema::dropIfExists('kurikulum_profiles');
        Schema::dropIfExists('siswa_profiles');
    }
};
