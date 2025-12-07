<?php

namespace App\Imports;

use App\Models\Kelas;
use App\Models\Guru;
use League\Csv\Reader;
use Exception;

class KelasImport
{
    protected $errors = [];
    protected $imported = 0;
    protected $skipped = 0;

    public function import(string $filePath): array
    {
        try {
            $csv = Reader::createFromPath($filePath, 'r');
            
            // Auto-detect delimiter (comma atau semicolon)
            $csv->setDelimiter(';');
            $csv->setHeaderOffset(0);
            $header = $csv->getHeader();
            
            if (count($header) === 1) {
                $csv->setDelimiter(',');
                $csv->setHeaderOffset(0);
            }
            
            $records = $csv->getRecords();
            $lineNumber = 1;

            foreach ($records as $record) {
                $lineNumber++;
                
                try {
                    // Validasi data required
                    if (empty($record['nama_kelas'])) {
                        $this->errors[] = "Baris {$lineNumber}: Nama kelas harus diisi";
                        $this->skipped++;
                        continue;
                    }

                    // Cek duplikasi nama kelas
                    $exists = Kelas::where('nama_kelas', trim($record['nama_kelas']))->first();
                    if ($exists) {
                        $this->errors[] = "Baris {$lineNumber}: Kelas '{$record['nama_kelas']}' sudah ada";
                        $this->skipped++;
                        continue;
                    }

                    $guruId = null;
                    
                    // Jika ada wali kelas, cari guru
                    if (!empty($record['wali_kelas'])) {
                        $guru = Guru::where('nama_guru', trim($record['wali_kelas']))->first();
                        if (!$guru) {
                            $this->errors[] = "Baris {$lineNumber}: Wali kelas '{$record['wali_kelas']}' tidak ditemukan";
                            $this->skipped++;
                            continue;
                        }
                        $guruId = $guru->id;
                    }

                    // Buat Kelas baru
                    Kelas::create([
                        'nama_kelas' => trim($record['nama_kelas']),
                        'guru_id' => $guruId,
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
}
