<?php

namespace App\Filament\Resources\TahunAjaran\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class TahunAjaranForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('tahun')
                    ->label('Tahun Ajaran')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Contoh: 2024/2025'),
                Toggle::make('flag')
                    ->label('Aktif')
                    ->default(false)
                    ->helperText('Tandai jika tahun ajaran ini sedang aktif'),
            ]);
    }
}
