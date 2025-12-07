<?php

namespace App\Filament\Resources\GuruMengajar\Pages;

use App\Filament\Resources\GuruMengajar\GuruMengajarResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGuruMengajar extends EditRecord
{
    protected static string $resource = GuruMengajarResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
