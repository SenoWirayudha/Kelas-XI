<?php

namespace App\Filament\Resources\GuruMengajar\Pages;

use App\Filament\Resources\GuruMengajar\GuruMengajarResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGuruMengajar extends ListRecords
{
    protected static string $resource = GuruMengajarResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
