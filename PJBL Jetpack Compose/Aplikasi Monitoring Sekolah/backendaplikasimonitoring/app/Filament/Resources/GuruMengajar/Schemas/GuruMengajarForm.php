<?php

namespace App\Filament\Resources\GuruMengajar\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class GuruMengajarForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('jadwal_id')
                    ->label('Jadwal')
                    ->relationship('jadwal', 'id')
                    ->getOptionLabelFromRecordUsing(fn ($record) => 
                        "{$record->guru->nama_guru} - {$record->mapel->nama_mapel} - {$record->kelas->nama_kelas} ({$record->hari}, Jam {$record->jam_ke})"
                    )
                    ->searchable()
                    ->preload()
                    ->required(),
                Select::make('status')
                    ->label('Status')
                    ->options([
                        'masuk' => 'Masuk',
                        'tidak_masuk' => 'Tidak Masuk',
                        'izin' => 'Izin',
                    ])
                    ->required()
                    ->default('masuk')
                    ->reactive(),
                
                DatePicker::make('izin_mulai')
                    ->label('Tanggal Mulai Izin')
                    ->native(false)
                    ->displayFormat('d/m/Y')
                    ->required()
                    ->reactive()
                    ->visible(fn (callable $get) => $get('status') === 'izin')
                    ->afterStateUpdated(function (callable $set, $state, callable $get) {
                        // Auto set izin_selesai jika belum diisi
                        if ($state && !$get('izin_selesai')) {
                            $set('izin_selesai', $state);
                        }
                    }),
                
                DatePicker::make('izin_selesai')
                    ->label('Tanggal Selesai Izin')
                    ->native(false)
                    ->displayFormat('d/m/Y')
                    ->required()
                    ->visible(fn (callable $get) => $get('status') === 'izin')
                    ->afterOrEqual('izin_mulai')
                    ->helperText('Tanggal selesai harus sama atau setelah tanggal mulai'),
                
                Select::make('guru_pengganti_id')
                    ->label('Guru Pengganti')
                    ->relationship('guruPengganti', 'nama_guru')
                    ->searchable()
                    ->preload()
                    ->nullable()
                    ->visible(fn (callable $get) => in_array($get('status'), ['tidak_masuk', 'izin']))
                    ->helperText('Pilih guru pengganti jika guru tidak masuk atau izin'),
                
                Textarea::make('keterangan')
                    ->label('Keterangan')
                    ->rows(3)
                    ->maxLength(65535)
                    ->columnSpanFull(),
            ]);
    }
}
