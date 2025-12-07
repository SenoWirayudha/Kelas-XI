<?php

namespace App\Imports;

use App\Models\Guru;
use League\Csv\Reader;
use Exception;

class GuruImport
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
                    if (empty($record['kode_guru']) || empty($record['nama_guru'])) {
                        $this->errors[] = "Baris {$lineNumber}: Kode Guru dan Nama Guru harus diisi";
                        $this->skipped++;
                        continue;
                    }

                    // Cek duplikasi kode guru
                    $exists = Guru::where('kode_guru', trim($record['kode_guru']))->first();
                    if ($exists) {
                        $this->errors[] = "Baris {$lineNumber}: Kode Guru '{$record['kode_guru']}' sudah ada";
                        $this->skipped++;
                        continue;
                    }

                    // Buat Guru baru
                    Guru::create([
                        'kode_guru' => trim($record['kode_guru']),
                        'nama_guru' => trim($record['nama_guru']),
                        'telepon' => !empty($record['telepon']) ? trim($record['telepon']) : null,
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
