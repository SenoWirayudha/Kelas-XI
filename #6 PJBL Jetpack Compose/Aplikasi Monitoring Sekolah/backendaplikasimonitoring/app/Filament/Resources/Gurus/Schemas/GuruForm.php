<?php

namespace App\Filament\Resources\Gurus\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class GuruForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('kode_guru')
                    ->label('Kode Guru')
                    ->required()
                    ->maxLength(255)
                    ->unique(ignoreRecord: true)
                    ->placeholder('Contoh: GR001'),
                TextInput::make('nama_guru')
                    ->label('Nama Guru')
                    ->required()
                    ->maxLength(255),
                TextInput::make('telepon')
                    ->label('Nomor Telepon')
                    ->tel()
                    ->maxLength(255)
                    ->placeholder('Contoh: 081234567890')
                    ->nullable(),
            ]);
    }
}
