<?php

namespace App\Filament\Resources\Gurus\Pages;

use App\Filament\Resources\Gurus\GuruResource;
use App\Imports\GuruImport;
use Filament\Actions\CreateAction;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Facades\Storage;

class ListGurus extends ListRecords
{
    protected static string $resource = GuruResource::class;

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
                        ->acceptedFileTypes(['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel'])
                        ->maxSize(5120)
                        ->required()
                        ->disk('local')
                        ->directory('imports')
                        ->visibility('private')
                        ->helperText('Format CSV: kode_guru, nama_guru, telepon. Delimiter: koma (,) atau titik koma (;)')
                ])
                ->action(function (array $data) {
                    try {
                        $filePath = Storage::disk('local')->path($data['file']);
                        
                        if (!file_exists($filePath)) {
                            throw new \Exception('File tidak ditemukan. Silakan coba upload ulang.');
                        }
                        
                        $import = new GuruImport();
                        $result = $import->import($filePath);
                        
                        if ($result['success']) {
                            $message = "Berhasil import {$result['imported']} guru";
                            
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
                        
                        Storage::disk('local')->delete($data['file']);
                        
                    } catch (\Exception $e) {
                        Notification::make()
                            ->title('Error Import')
                            ->danger()
                            ->body($e->getMessage())
                            ->send();
                            
                        if (isset($data['file']) && Storage::disk('local')->exists($data['file'])) {
                            Storage::disk('local')->delete($data['file']);
                        }
                    }
                }),
        ];
    }
}
