<?php

namespace App\Imports;

use App\Models\Jadwal;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\Mapel;
use App\Models\TahunAjaran;
use League\Csv\Reader;
use Exception;

class JadwalImport
{
    protected $errors = [];
    protected $imported = 0;
    protected $skipped = 0;

    public function import(string $filePath): array
    {
        try {
            $csv = Reader::createFromPath($filePath, 'r');
            
            // Auto-detect delimiter (comma atau semicolon)
            $csv->setDelimiter(';'); // Coba semicolon dulu
            $csv->setHeaderOffset(0);
            $header = $csv->getHeader();
            
            // Jika header cuma 1 kolom, berarti bukan semicolon, ganti ke comma
            if (count($header) === 1) {
                $csv->setDelimiter(',');
                $csv->setHeaderOffset(0);
            }
            
            $records = $csv->getRecords();
            $lineNumber = 1; // Header di baris 1

            foreach ($records as $record) {
                $lineNumber++;
                
                try {
                    // Validasi data required
                    if (empty($record['nama_guru']) || empty($record['nama_kelas']) || 
                        empty($record['nama_mapel']) || empty($record['tahun']) ||
                        empty($record['jam_ke']) || empty($record['hari'])) {
                        $this->errors[] = "Baris {$lineNumber}: Data tidak lengkap";
                        $this->skipped++;
                        continue;
                    }

                    // Cari Guru berdasarkan nama
                    $guru = Guru::where('nama_guru', trim($record['nama_guru']))->first();
                    if (!$guru) {
                        $this->errors[] = "Baris {$lineNumber}: Guru '{$record['nama_guru']}' tidak ditemukan";
                        $this->skipped++;
                        continue;
                    }

                    // Cari Kelas berdasarkan nama kelas
                    $kelas = Kelas::where('nama_kelas', trim($record['nama_kelas']))->first();
                    if (!$kelas) {
                        $this->errors[] = "Baris {$lineNumber}: Kelas '{$record['nama_kelas']}' tidak ditemukan";
                        $this->skipped++;
                        continue;
                    }

                    // Cari Mapel berdasarkan nama mapel
                    $mapel = Mapel::where('nama_mapel', trim($record['nama_mapel']))->first();
                    if (!$mapel) {
                        $this->errors[] = "Baris {$lineNumber}: Mapel '{$record['nama_mapel']}' tidak ditemukan";
                        $this->skipped++;
                        continue;
                    }

                    // Cari Tahun Ajaran berdasarkan tahun
                    $tahunAjaran = TahunAjaran::where('tahun', trim($record['tahun']))->first();
                    if (!$tahunAjaran) {
                        $this->errors[] = "Baris {$lineNumber}: Tahun Ajaran '{$record['tahun']}' tidak ditemukan";
                        $this->skipped++;
                        continue;
                    }

                    // Validasi hari
                    $hariValid = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    if (!in_array(trim($record['hari']), $hariValid)) {
                        $this->errors[] = "Baris {$lineNumber}: Hari '{$record['hari']}' tidak valid. Harus salah satu dari: " . implode(', ', $hariValid);
                        $this->skipped++;
                        continue;
                    }

                    // Validasi dan parse jam_ke
                    // Support format: "1", "2", atau "1-2", "3-4"
                    $jamKeValue = trim($record['jam_ke']);
                    
                    // Cek apakah format range (contoh: "1-2")
                    if (strpos($jamKeValue, '-') !== false) {
                        $parts = explode('-', $jamKeValue);
                        if (count($parts) !== 2) {
                            $this->errors[] = "Baris {$lineNumber}: Format Jam Ke tidak valid. Gunakan angka (1) atau range (1-2)";
                            $this->skipped++;
                            continue;
                        }
                        
                        $start = trim($parts[0]);
                        $end = trim($parts[1]);
                        
                        if (!is_numeric($start) || !is_numeric($end)) {
                            $this->errors[] = "Baris {$lineNumber}: Jam Ke harus berupa angka. Contoh: 1 atau 1-2";
                            $this->skipped++;
                            continue;
                        }
                        
                        if ($start < 1 || $end < 1 || $start > $end) {
                            $this->errors[] = "Baris {$lineNumber}: Range Jam Ke tidak valid. Contoh: 1-2, 3-4";
                            $this->skipped++;
                            continue;
                        }
                        
                        // Simpan sebagai string "1-2"
                        $jamKe = $jamKeValue;
                    } 
                    // Format angka tunggal
                    else {
                        if (!is_numeric($jamKeValue) || $jamKeValue < 1) {
                            $this->errors[] = "Baris {$lineNumber}: Jam Ke harus berupa angka minimal 1 atau range (1-2)";
                            $this->skipped++;
                            continue;
                        }
                        $jamKe = (int)$jamKeValue;
                    }

                    // Buat Jadwal baru
                    Jadwal::create([
                        'guru_id' => $guru->id,
                        'mapel_id' => $mapel->id,
                        'tahun_ajaran_id' => $tahunAjaran->id,
                        'kelas_id' => $kelas->id,
                        'jam_ke' => $jamKe,
                        'hari' => trim($record['hari'])
                    ]);

                    $this->imported++;
                } catch (Exception $e) {
                    $this->errors[] = "Baris {$lineNumber}: " . $e->getMessage();
                    $this->skipped++;
                }
            }

            return [
                'success' => true,
                'imported' => $this->imported,
                'skipped' => $this->skipped,
                'errors' => $this->errors
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'imported' => 0,
                'skipped' => 0,
                'errors' => ['Error membaca file: ' . $e->getMessage()]
            ];
        }
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getImportedCount(): int
    {
        return $this->imported;
    }

    public function getSkippedCount(): int
    {
        return $this->skipped;
    }
}
