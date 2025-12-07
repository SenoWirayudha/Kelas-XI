<?php

namespace App\Filament\Resources\TahunAjaran;

use App\Filament\Resources\TahunAjaran\Pages\CreateTahunAjaran;
use App\Filament\Resources\TahunAjaran\Pages\EditTahunAjaran;
use App\Filament\Resources\TahunAjaran\Pages\ListTahunAjaran;
use App\Filament\Resources\TahunAjaran\Schemas\TahunAjaranForm;
use App\Filament\Resources\TahunAjaran\Tables\TahunAjaranTable;
use App\Models\TahunAjaran;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class TahunAjaranResource extends Resource
{
    protected static ?string $model = TahunAjaran::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCalendar;

    protected static ?string $navigationLabel = 'Tahun Ajaran';

    protected static ?string $modelLabel = 'Tahun Ajaran';

    protected static ?string $pluralModelLabel = 'Tahun Ajaran';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return TahunAjaranForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TahunAjaranTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListTahunAjaran::route('/'),
            'create' => CreateTahunAjaran::route('/create'),
            'edit' => EditTahunAjaran::route('/{record}/edit'),
        ];
    }
}
