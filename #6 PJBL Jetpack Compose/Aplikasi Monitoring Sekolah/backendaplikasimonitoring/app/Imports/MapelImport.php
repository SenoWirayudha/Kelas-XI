<?php

namespace App\Imports;

use App\Models\Mapel;
use League\Csv\Reader;
use Exception;

class MapelImport
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
                    if (empty($record['kode_mapel']) || empty($record['nama_mapel'])) {
                        $this->errors[] = "Baris {$lineNumber}: Data tidak lengkap";
                        $this->skipped++;
                        continue;
                    }

                    // Cek duplikasi kode mapel
                    $exists = Mapel::where('kode_mapel', trim($record['kode_mapel']))->first();
                    if ($exists) {
                        $this->errors[] = "Baris {$lineNumber}: Kode Mapel '{$record['kode_mapel']}' sudah ada";
                        $this->skipped++;
                        continue;
                    }

                    // Buat Mapel baru
                    Mapel::create([
                        'kode_mapel' => trim($record['kode_mapel']),
                        'nama_mapel' => trim($record['nama_mapel']),
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
