<?php

namespace App\Filament\Resources\Jadwal\Pages;

use App\Filament\Resources\Jadwal\JadwalResource;
use App\Imports\JadwalImport;
use Filament\Actions\CreateAction;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Facades\Storage;

class ListJadwal extends ListRecords
{
    protected static string $resource = JadwalResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
            Action::make('import')
                ->label('Import CSV')
                ->icon('heroicon-o-arrow-up-tray')
                ->color('success')
                ->form([
                    FileUpload::make('file')
                        ->label('File CSV')
                        ->acceptedFileTypes(['text/csv', 'text/plain', 'application/vnd.ms-excel'])
                        ->required()
                        ->disk('local') // Simpan di disk local
                        ->directory('imports') // Directory khusus untuk import
                        ->visibility('private')
                        ->helperText('Format CSV: nama_guru, nama_kelas, nama_mapel, tahun, jam_ke, hari. Jam ke bisa: 1 atau 1-2. Delimiter: koma (,) atau titik koma (;)')
                ])
                ->action(function (array $data) {
                    try {
                        // Cara yang benar untuk mendapatkan path file dari FileUpload
                        $filePath = Storage::disk('local')->path($data['file']);
                        
                        // Cek apakah file exists
                        if (!file_exists($filePath)) {
                            throw new \Exception('File tidak ditemukan. Silakan coba upload ulang.');
                        }
                        
                        $import = new JadwalImport();
                        $result = $import->import($filePath);
                        
                        if ($result['success']) {
                            $message = "Berhasil import {$result['imported']} jadwal";
                            
                            if ($result['skipped'] > 0) {
                                $message .= ", {$result['skipped']} dilewati";
                            }
                            
                            if (!empty($result['errors'])) {
                                Notification::make()
                                    ->title($message)
                                    ->warning()
                                    ->body('Ada beberapa error: ' . implode(', ', array_slice($result['errors'], 0, 3)))
                                    ->send();
                            } else {
                                Notification::make()
                                    ->title($message)
                                    ->success()
                                    ->send();
                            }
                        } else {
                            Notification::make()
                                ->title('Import gagal')
                                ->danger()
                                ->body(implode(', ', $result['errors']))
                                ->send();
                        }
                        
                        // Hapus file setelah import menggunakan Storage facade
                        Storage::disk('local')->delete($data['file']);
                        
                    } catch (\Exception $e) {
                        Notification::make()
                            ->title('Error Import')
                            ->danger()
                            ->body($e->getMessage())
                            ->send();
                            
                        // Cleanup file jika ada error
                        if (isset($data['file']) && Storage::disk('local')->exists($data['file'])) {
                            Storage::disk('local')->delete($data['file']);
                        }
                    }
                }),
        ];
    }
}