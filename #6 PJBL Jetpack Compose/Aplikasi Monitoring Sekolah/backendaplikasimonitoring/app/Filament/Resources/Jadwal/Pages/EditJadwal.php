<?php

namespace App\Filament\Resources\Jadwal\Pages;

use App\Filament\Resources\Jadwal\JadwalResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditJadwal extends EditRecord
{
    protected static string $resource = JadwalResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
