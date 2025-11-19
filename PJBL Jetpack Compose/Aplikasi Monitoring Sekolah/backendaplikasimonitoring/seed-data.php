<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\Guru;

echo "=== Seeding Sample Data ===\n\n";

// Seed Kelas
$kelasData = [
    ['nama_kelas' => '10 IPA 1'],
    ['nama_kelas' => '10 IPA 2'],
    ['nama_kelas' => '11 IPA 1'],
    ['nama_kelas' => '11 IPA 2'],
    ['nama_kelas' => '12 IPA 1'],
];

foreach ($kelasData as $data) {
    Kelas::firstOrCreate(['nama_kelas' => $data['nama_kelas']], $data);
}
echo "✅ Created " . count($kelasData) . " Kelas\n";

// Seed Mapel
$mapelData = [
    ['kode_mapel' => 'MAT', 'nama_mapel' => 'Matematika'],
    ['kode_mapel' => 'FIS', 'nama_mapel' => 'Fisika'],
    ['kode_mapel' => 'KIM', 'nama_mapel' => 'Kimia'],
    ['kode_mapel' => 'BIO', 'nama_mapel' => 'Biologi'],
    ['kode_mapel' => 'ING', 'nama_mapel' => 'Bahasa Inggris'],
    ['kode_mapel' => 'IND', 'nama_mapel' => 'Bahasa Indonesia'],
];

foreach ($mapelData as $data) {
    Mapel::firstOrCreate(['kode_mapel' => $data['kode_mapel']], $data);
}
echo "✅ Created " . count($mapelData) . " Mapel\n";

// Seed Guru
$guruData = [
    ['kode_guru' => 'GR001', 'nama_guru' => 'Budi Santoso', 'telepon' => '081234567890'],
    ['kode_guru' => 'GR002', 'nama_guru' => 'Siti Nurhaliza', 'telepon' => '081234567891'],
    ['kode_guru' => 'GR003', 'nama_guru' => 'Ahmad Dahlan', 'telepon' => '081234567892'],
    ['kode_guru' => 'GR004', 'nama_guru' => 'Dewi Lestari', 'telepon' => '081234567893'],
    ['kode_guru' => 'GR005', 'nama_guru' => 'Rudi Hartono', 'telepon' => '081234567894'],
];

foreach ($guruData as $data) {
    Guru::firstOrCreate(['kode_guru' => $data['kode_guru']], $data);
}
echo "✅ Created " . count($guruData) . " Guru\n";

echo "\n=== Seeding Complete! ===\n";
echo "\nYou can now view the data in Filament:\n";
echo "- Kelas: http://127.0.0.1:8000/admin/kelas\n";
echo "- Mapel: http://127.0.0.1:8000/admin/mapel\n";
echo "- Guru: http://127.0.0.1:8000/admin/gurus\n";
