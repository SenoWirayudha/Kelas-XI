<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Jadwal;
use App\Models\GuruMengajar;

echo "Seeding guru_mengajars table...\n";

// Get all jadwals
$jadwals = Jadwal::all();

if ($jadwals->isEmpty()) {
    echo "❌ No jadwals found! Please seed jadwals first.\n";
    exit(1);
}

echo "Found {$jadwals->count()} jadwals\n";

// Create guru_mengajar for each jadwal with status "masuk"
foreach ($jadwals as $jadwal) {
    GuruMengajar::create([
        'jadwal_id' => $jadwal->id,
        'status' => 'masuk',
        'keterangan' => 'Hadir mengajar'
    ]);
    echo "✓ Created guru_mengajar for jadwal_id {$jadwal->id}\n";
}

// Add some "tidak_masuk" entries
$tidakMasukData = [
    ['jadwal_id' => 1, 'status' => 'tidak_masuk', 'keterangan' => 'Guru sakit'],
    ['jadwal_id' => 2, 'status' => 'tidak_masuk', 'keterangan' => 'Izin rapat dinas'],
    ['jadwal_id' => 3, 'status' => 'tidak_masuk', 'keterangan' => 'Cuti keluarga'],
];

foreach ($tidakMasukData as $data) {
    // Only create if jadwal exists
    if (Jadwal::find($data['jadwal_id'])) {
        GuruMengajar::create($data);
        echo "✓ Created tidak_masuk entry for jadwal_id {$data['jadwal_id']}\n";
    }
}

$total = GuruMengajar::count();
echo "\n✅ Done! Total guru_mengajars: {$total}\n";
