<?php

namespace App\Filament\Resources\Mapel\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class MapelForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('kode_mapel')
                    ->label('Kode Mata Pelajaran')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Contoh: MAT'),
                TextInput::make('nama_mapel')
                    ->label('Nama Mata Pelajaran')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Contoh: Matematika'),
            ]);
    }
}
