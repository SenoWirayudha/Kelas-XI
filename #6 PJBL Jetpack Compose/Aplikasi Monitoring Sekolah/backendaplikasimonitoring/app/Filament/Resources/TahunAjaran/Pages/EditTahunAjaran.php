<?php

namespace App\Filament\Resources\TahunAjaran\Pages;

use App\Filament\Resources\TahunAjaran\TahunAjaranResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTahunAjaran extends EditRecord
{
    protected static string $resource = TahunAjaranResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
